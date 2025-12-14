import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Section {
  id: string;
  name: string;
  type: 'hero' | 'features' | 'reviews' | 'custom';
  content: any;
  order: number;
}

@Component({
  selector: 'app-advanced-editor',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './advanced-editor.component.html',
  styleUrls: ['./advanced-editor.component.css'],
})
export class AdvancedEditorComponent implements OnInit {
  // Layout
  activePanel: 'editor' | 'preview' | 'properties' = 'editor';
  selectedSectionId: string | null = null;
  expandedSectionId: string | null = null;

  // Content
  sections: Section[] = [];
  pageContent: any = null;
  previewHtml: SafeHtml = '';

  // Properties Panel
  selectedProperties: any = null;
  colorPicker: any = {};

  // File Upload
  dragOverSection: string | null = null;
  uploadingSection: string | null = null;

  // History
  history: Section[][] = [];
  historyIndex: number = -1;

  private apiUrl = 'http://localhost:3000/api/admin';
  private imageUploadUrl = 'http://localhost:3000/api/admin/upload-image';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadPageContent();
  }

  // ========== LOAD & SAVE ==========
  loadPageContent() {
    this.http.get(`${this.apiUrl}/page-content`).subscribe({
      next: (data: any) => {
        this.pageContent = data;
        this.initializeSections();
      },
      error: () => {
        console.error('Failed to load page content');
        this.initializeDefaultSections();
      },
    });
  }

  initializeSections() {
    this.sections = [
      {
        id: 'hero',
        name: 'Hero Section',
        type: 'hero',
        content: this.pageContent?.hero || this.getDefaultHeroContent(),
        order: 1,
      },
      {
        id: 'features',
        name: 'Features',
        type: 'features',
        content: this.pageContent?.features || [],
        order: 2,
      },
      {
        id: 'reviews',
        name: 'Reviews',
        type: 'reviews',
        content: this.pageContent?.reviews || [],
        order: 3,
      },
    ];
    this.generatePreview();
  }

  initializeDefaultSections() {
    this.sections = [
      {
        id: 'hero',
        name: 'Hero Section',
        type: 'hero',
        content: this.getDefaultHeroContent(),
        order: 1,
      },
    ];
  }

  getDefaultHeroContent() {
    return {
      title: 'Artisan Craftsmanship Meets Modern Elegance',
      subtitle: 'Handcrafted apparel from local artisans',
      backgroundImage: '',
      backgroundColor: '#0f0f0f',
      textColor: '#ffffff',
      primaryButton: { text: 'Explore', link: '/products', color: '#3b82f6' },
      secondaryButton: { text: 'Learn More', link: '/about', color: 'transparent' },
    };
  }

  savePageContent() {
    const updateData = {
      hero: this.sections.find((s) => s.id === 'hero')?.content,
      features: this.sections.find((s) => s.id === 'features')?.content,
      reviews: this.sections.find((s) => s.id === 'reviews')?.content,
    };

    this.http.put(`${this.apiUrl}/page-content`, updateData).subscribe({
      next: () => {
        console.log('Page content saved successfully');
        this.addToHistory();
      },
      error: () => {
        console.error('Failed to save page content');
      },
    });
  }

  // ========== SECTION MANAGEMENT ==========
  selectSection(sectionId: string) {
    this.selectedSectionId = sectionId;
    const section = this.sections.find((s) => s.id === sectionId);
    if (section) {
      this.selectedProperties = { ...section.content };
    }
  }

  deleteSection(sectionId: string) {
    if (confirm('Are you sure you want to delete this section?')) {
      this.sections = this.sections.filter((s) => s.id !== sectionId);
      if (this.selectedSectionId === sectionId) {
        this.selectedSectionId = null;
        this.selectedProperties = null;
      }
      this.generatePreview();
      this.savePageContent();
    }
  }

  addNewSection() {
    const newId = `section-${Date.now()}`;
    const newSection: Section = {
      id: newId,
      name: 'New Section',
      type: 'custom',
      content: {
        title: 'New Section',
        description: 'Add your content here',
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
      order: this.sections.length + 1,
    };
    this.sections.push(newSection);
    this.selectSection(newId);
    this.generatePreview();
  }

  duplicateSection(sectionId: string) {
    const originalSection = this.sections.find((s) => s.id === sectionId);
    if (originalSection) {
      const newId = `${sectionId}-copy-${Date.now()}`;
      const newSection: Section = {
        ...originalSection,
        id: newId,
        name: originalSection.name + ' (Copy)',
        content: JSON.parse(JSON.stringify(originalSection.content)),
      };
      this.sections.push(newSection);
      this.generatePreview();
    }
  }

  // ========== PROPERTIES EDITING ==========
  updateProperty(key: string, value: any) {
    if (this.selectedSectionId && this.selectedProperties) {
      this.selectedProperties[key] = value;
      const section = this.sections.find((s) => s.id === this.selectedSectionId);
      if (section) {
        section.content[key] = value;
        this.generatePreview();
      }
    }
  }

  // Handle nested object updates (e.g., button properties)
  updateNestedProperty(parentKey: string, childKey: string, value: any) {
    if (this.selectedSectionId && this.selectedProperties) {
      if (!this.selectedProperties[parentKey]) {
        this.selectedProperties[parentKey] = {};
      }
      this.selectedProperties[parentKey][childKey] = value;
      const section = this.sections.find((s) => s.id === this.selectedSectionId);
      if (section) {
        if (!section.content[parentKey]) {
          section.content[parentKey] = {};
        }
        section.content[parentKey][childKey] = value;
        this.generatePreview();
      }
    }
  }

  // ========== IMAGE UPLOAD ==========
  onDragOver(event: DragEvent, sectionId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverSection = sectionId;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOverSection = null;
  }

  onDrop(event: DragEvent, sectionId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverSection = null;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadImage(files[0], sectionId);
    }
  }

  onFileSelected(event: any, sectionId: string) {
    const file = event.target.files[0];
    if (file) {
      this.uploadImage(file, sectionId);
    }
  }

  uploadImage(file: File, sectionId: string) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    this.uploadingSection = sectionId;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sectionId', sectionId);

    this.http.post(`${this.apiUrl}/upload-image`, formData).subscribe({
      next: (response: any) => {
        const imageUrl = response.url;
        this.updateProperty('backgroundImage', imageUrl);
        this.uploadingSection = null;
      },
      error: () => {
        alert('Failed to upload image');
        this.uploadingSection = null;
      },
    });
  }

  // ========== LIVE PREVIEW ==========
  generatePreview() {
    let previewHTML = `<div class="page-preview">`;

    this.sections.forEach((section) => {
      if (section.type === 'hero') {
        previewHTML += this.generateHeroPreview(section.content);
      } else if (section.type === 'features') {
        previewHTML += this.generateFeaturesPreview(section.content);
      } else if (section.type === 'reviews') {
        previewHTML += this.generateReviewsPreview(section.content);
      } else if (section.type === 'custom') {
        previewHTML += this.generateCustomPreview(section.content);
      }
    });

    previewHTML += `</div>`;
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(previewHTML);
  }

  generateHeroPreview(content: any): string {
    const bgImage = content.backgroundImage
      ? `background-image: url('${content.backgroundImage}');`
      : '';
    return `
      <section style="background: ${
        content.backgroundColor
      }; ${bgImage} background-size: cover; background-position: center; padding: 80px 20px; text-align: center; color: ${
      content.textColor
    }; position: relative;">
        <div style="position: relative; z-index: 2;">
          <h1 style="font-size: 3.5em; margin-bottom: 20px; font-weight: 700; letter-spacing: -1px;">${
            content.title
          }</h1>
          <p style="font-size: 1.3em; margin-bottom: 40px; opacity: 0.9;">${content.subtitle}</p>
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button style="padding: 15px 40px; background: ${
              content.primaryButton?.color || '#3b82f6'
            }; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">${
      content.primaryButton?.text
    }</button>
            <button style="padding: 15px 40px; background: transparent; color: ${
              content.textColor
            }; border: 2px solid ${
      content.textColor
    }; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">${
      content.secondaryButton?.text
    }</button>
          </div>
        </div>
        ${
          content.backgroundImage
            ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 1;"></div>`
            : ''
        }
      </section>
    `;
  }

  generateFeaturesPreview(features: any[]): string {
    if (!features || features.length === 0) return '';
    return `
      <section style="padding: 60px 20px; background: #f9fafb;">
        <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #1f2937;">Our Features</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
          ${features
            .map(
              (f: any) => `
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: all 0.3s;">
              <div style="font-size: 2.5em; margin-bottom: 20px; color: #3b82f6;">
                <i class="fas ${f.icon}"></i>
              </div>
              <h3 style="font-size: 1.3em; margin-bottom: 10px; color: #1f2937;">${f.title}</h3>
              <p style="color: #6b7280; line-height: 1.6;">${f.description}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  generateReviewsPreview(reviews: any[]): string {
    if (!reviews || reviews.length === 0) return '';
    return `
      <section style="padding: 60px 20px; background: white;">
        <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #1f2937;">Customer Reviews</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
          ${reviews
            .map(
              (r: any) => `
            <div style="background: #f9fafb; padding: 30px; border-radius: 12px; border-left: 4px solid #3b82f6;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <strong style="font-size: 1.1em; margin-right: 10px;">${r.name}</strong>
                <span style="color: #999; font-size: 0.9em;">${r.role}</span>
              </div>
              <div style="color: #ffc107; margin-bottom: 15px;">${'⭐'.repeat(r.rating || 5)}</div>
              <p style="color: #333; line-height: 1.6; font-style: italic;">"${r.comment}"</p>
              <small style="color: #999;">${r.date}</small>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  generateCustomPreview(content: any): string {
    return `
      <section style="background: ${content.backgroundColor}; padding: 50px 20px; text-align: center; color: ${content.textColor};">
        <h2 style="font-size: 2em; margin-bottom: 20px;">${content.title}</h2>
        <p style="font-size: 1.1em; line-height: 1.8;">${content.description}</p>
      </section>
    `;
  }

  // ========== UNDO/REDO ==========
  addToHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.sections)));
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.sections = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.generatePreview();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.sections = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.generatePreview();
    }
  }

  // ========== LAYOUT HELPERS ==========
  toggleSection(sectionId: string) {
    this.expandedSectionId = this.expandedSectionId === sectionId ? null : sectionId;
  }

  getSectionIcon(type: string): string {
    switch (type) {
      case 'hero':
        return 'fa-image';
      case 'features':
        return 'fa-star';
      case 'reviews':
        return 'fa-comments';
      default:
        return 'fa-cube';
    }
  }
}
