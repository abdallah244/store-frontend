import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './page-editor.component.html',
  styleUrls: ['./page-editor.component.css'],
})
export class PageEditorComponent implements OnInit {
  pageContent: any = null;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  // Live Preview
  showPreview = false;
  previewHtml: SafeHtml = '';

  // Tabs
  activeTab = 'hero';

  // Form data
  heroForm = {
    title: '',
    subtitle: '',
    backgroundColor: '',
    textColor: '',
    backgroundImage: '',
  };

  primaryButtonForm = {
    text: '',
    link: '',
  };

  secondaryButtonForm = {
    text: '',
    link: '',
  };

  newFeature = {
    icon: '',
    title: '',
    description: '',
  };

  newReview = {
    name: '',
    role: '',
    rating: 5,
    comment: '',
    date: '',
    image: '',
  };

  newPromotion = {
    text: '',
    icon: '',
  };

  private apiUrl = 'http://localhost:3000/api/admin';

  // Drag & Drop Feature Sorting
  draggedFeatureIndex: number | null = null;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadPageContent();
  }

  // Load page content from backend
  loadPageContent() {
    this.loading = true;
    this.error = '';
    this.http.get(`${this.apiUrl}/page-content`).subscribe({
      next: (response: any) => {
        this.pageContent = response;
        this.populateForms();
        this.loading = false;
        this.successMessage = 'Page content loaded successfully!';
        setTimeout(() => (this.successMessage = ''), 2000);
      },
      error: (err) => {
        console.error('Error loading page content:', err);
        this.error = 'Failed to load page content. Please try again.';
        this.loading = false;
      },
    });
  }

  togglePreview() {
    this.showPreview = !this.showPreview;

    if (this.showPreview) {
      const html = this.generatePreview();
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }
  }

  generatePreview(): string {
    return `
      <section style="
        background-color: ${this.heroForm.backgroundColor};
        color: ${this.heroForm.textColor};
        background-image: url('${this.heroForm.backgroundImage}');
        padding: 40px;
        text-align: center;">
        <h1>${this.heroForm.title}</h1>
        <p>${this.heroForm.subtitle}</p>
      </section>
    `;
  }

  // Populate forms with existing data
  populateForms() {
    if (this.pageContent?.hero) {
      this.heroForm = { ...this.pageContent.hero };
      this.primaryButtonForm = {
        ...this.pageContent.hero.primaryButton,
      };
      this.secondaryButtonForm = {
        ...this.pageContent.hero.secondaryButton,
      };
    }
  }

  // Save hero section
  saveHero() {
    this.saving = true;
    const updateData = {
      hero: {
        title: this.heroForm.title,
        subtitle: this.heroForm.subtitle,
        backgroundColor: this.heroForm.backgroundColor,
        textColor: this.heroForm.textColor,
        backgroundImage: this.heroForm.backgroundImage,
        primaryButton: this.primaryButtonForm,
        secondaryButton: this.secondaryButtonForm,
      },
    };

    this.http.put(`${this.apiUrl}/page-content`, updateData).subscribe({
      next: () => {
        this.successMessage = 'Hero section updated successfully!';
        this.saving = false;
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadPageContent();
      },
      error: (err) => {
        this.error = 'Failed to save hero section';
        this.saving = false;
      },
    });
  }

  // Add feature
  addFeature() {
    if (!this.newFeature.title || !this.newFeature.description) {
      this.error = 'Please fill in all feature fields';
      return;
    }

    this.saving = true;
    this.http.post(`${this.apiUrl}/page-content/features/add`, this.newFeature).subscribe({
      next: () => {
        this.successMessage = 'Feature added successfully!';
        this.newFeature = { icon: '', title: '', description: '' };
        this.saving = false;
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadPageContent();
      },
      error: (err) => {
        this.error = 'Failed to add feature';
        this.saving = false;
      },
    });
  }

  // Remove feature
  removeFeature(index: number) {
    if (confirm('Are you sure you want to remove this feature?')) {
      this.http.delete(`${this.apiUrl}/page-content/features/${index}`).subscribe({
        next: () => {
          this.successMessage = 'Feature removed successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.loadPageContent();
        },
        error: () => {
          this.error = 'Failed to remove feature';
        },
      });
    }
  }

  // Drag Start
  dragStartFeature(index: number) {
    this.draggedFeatureIndex = index;
  }

  // Drag Over - Allow Drop
  dragOverFeature(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Allow Drop
  allowDrop(event: any) {
    event.preventDefault();
  }

  // Drop Feature Into New Position
  dropFeature(event: any, targetIndex: number) {
    event.preventDefault();

    if (this.draggedFeatureIndex === null) return;

    const draggedItem = this.pageContent.features.splice(this.draggedFeatureIndex, 1)[0];
    this.pageContent.features.splice(targetIndex, 0, draggedItem);

    this.draggedFeatureIndex = null;
  }

  // Add review
  addReview() {
    if (!this.newReview.name || !this.newReview.comment) {
      this.error = 'Please fill in required review fields';
      return;
    }

    this.saving = true;
    this.http.post(`${this.apiUrl}/page-content/reviews/add`, this.newReview).subscribe({
      next: () => {
        this.successMessage = 'Review added successfully!';
        this.newReview = {
          name: '',
          role: '',
          rating: 5,
          comment: '',
          date: '',
          image: '',
        };
        this.saving = false;
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadPageContent();
      },
      error: (err) => {
        this.error = 'Failed to add review';
        this.saving = false;
      },
    });
  }

  // Remove review
  removeReview(index: number) {
    if (confirm('Are you sure you want to remove this review?')) {
      this.http.delete(`${this.apiUrl}/page-content/reviews/${index}`).subscribe({
        next: () => {
          this.successMessage = 'Review removed successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.loadPageContent();
        },
        error: () => {
          this.error = 'Failed to remove review';
        },
      });
    }
  }

  // Add promotion
  addPromotion() {
    if (!this.newPromotion.text) {
      this.error = 'Please enter promotion text';
      return;
    }

    this.saving = true;
    this.http.post(`${this.apiUrl}/page-content/promotions/add`, this.newPromotion).subscribe({
      next: () => {
        this.successMessage = 'Promotion added successfully!';
        this.newPromotion = { text: '', icon: '' };
        this.saving = false;
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadPageContent();
      },
      error: (err) => {
        this.error = 'Failed to add promotion';
        this.saving = false;
      },
    });
  }

  // Remove promotion
  removePromotion(index: number) {
    if (confirm('Are you sure you want to remove this promotion?')) {
      this.http.delete(`${this.apiUrl}/page-content/promotions/${index}`).subscribe({
        next: () => {
          this.successMessage = 'Promotion removed successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.loadPageContent();
        },
        error: () => {
          this.error = 'Failed to remove promotion';
        },
      });
    }
  }

  // Switch tabs
  switchTab(tab: string) {
    this.activeTab = tab;
    this.error = '';
  }
}
