// consolidated to single AboutComponent with full content model
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  bio: string;
}

interface HeroContent {
  image: string;
}

interface BrandStory {
  title: string;
  description: string;
  image: string;
}

interface CeoStory {
  name: string;
  title: string;
  image: string;
  story: string;
}

interface BrandStats {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit, OnDestroy {
  hero: HeroContent = {
    image: '/assets/about/hero.jpg',
  };

  // Brand Story
  brandStory: BrandStory = {
    title: 'Our Story',
    description: '',
    image: '/assets/about/brand-story.jpg',
  };

  // Team Members
  teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Ahmed Mohamed',
      position: 'Founder & CEO',
      image: '/assets/team/member1.jpg',
      bio: 'Leader with decades of experience in artisan craftsmanship.',
    },
    {
      id: '2',
      name: 'Fatima Ali',
      position: 'Design Director',
      image: '/assets/team/member2.jpg',
      bio: 'Designer blending contemporary silhouettes with heritage craft.',
    },
    {
      id: '3',
      name: 'Mahmoud Salem',
      position: 'Production Lead',
      image: '/assets/team/member3.jpg',
      bio: 'Specialist in production quality and artisan partnerships.',
    },
  ];

  // Brand Statistics
  stats: BrandStats[] = [
    { label: 'Artisans', value: '25+', icon: 'fas fa-users' },
    { label: 'Products Crafted', value: '500+', icon: 'fas fa-box' },
    { label: 'Happy Clients', value: '1000+', icon: 'fas fa-smile' },
    { label: 'Years of Craft', value: '15', icon: 'fas fa-hourglass-end' },
  ];

  // CEO Story
  ceoStory: CeoStory = {
    name: 'Ahmed Mohamed',
    title: 'Founder & CEO',
    image: '/assets/team/ceo.jpg',
    story: '',
  };

  // Modal states
  showStoryModal = false;
  currentTeamMember: TeamMember | null = null;
  carouselIndex = 0;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAboutContent();
    // Auto-refresh when admin saves About content
    window.addEventListener('aboutContentUpdated', this.handleAboutContentUpdated);
  }

  loadAboutContent(): void {
    this.adminService.getAboutContent().subscribe({
      next: (content: any) => {
        if (content) {
          this.hero.image = content.heroImage || this.hero.image;
          this.brandStory.description = content.brandStory || this.brandStory.description;
          this.brandStory.image = content.brandImage || this.brandStory.image;
          this.ceoStory.story = content.ceoStory || this.ceoStory.story;
          this.ceoStory.image = content.ceoImage || this.ceoStory.image;
          if (content.teamMembers && content.teamMembers.length > 0) {
            this.teamMembers = content.teamMembers;
          }
          if (content.stats && content.stats.length > 0) {
            this.stats = content.stats;
          }
        }
        console.log('About content loaded:', { teamMembers: this.teamMembers, stats: this.stats });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading about content:', err);
        this.cdr.markForCheck();
      },
    });
  }

  openTeamMemberStory(member: TeamMember): void {
    this.currentTeamMember = member;
    this.showStoryModal = true;
  }

  closeTeamMemberStory(): void {
    this.showStoryModal = false;
    this.currentTeamMember = null;
  }

  nextTeamMember(): void {
    if (this.teamMembers.length > 0) {
      this.carouselIndex = (this.carouselIndex + 1) % this.teamMembers.length;
      this.cdr.markForCheck();
    }
  }

  prevTeamMember(): void {
    if (this.teamMembers.length > 0) {
      this.carouselIndex =
        (this.carouselIndex - 1 + this.teamMembers.length) % this.teamMembers.length;
      this.cdr.markForCheck();
    }
  }

  setTeamMemberIndex(index: number): void {
    if (index >= 0 && index < this.teamMembers.length) {
      this.carouselIndex = index;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('aboutContentUpdated', this.handleAboutContentUpdated);
  }

  private handleAboutContentUpdated = () => {
    this.loadAboutContent();
  };
}
