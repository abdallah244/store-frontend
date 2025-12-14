import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SigninComponent } from './signin/signin.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { SettingsComponent } from './settings/settings.component';
import { MyFeedbackComponent } from './my-feedback/my-feedback.component';
import { AboutComponent } from './about/about.component';
import { ProductsComponent } from './products/products.component';
import { CartComponent } from './cart/cart.component';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { OrdersComponent } from './admin/orders/orders.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'profile', component: MyProfileComponent },
  { path: 'my-profile', component: MyProfileComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'contact-us', component: SettingsComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'my-feedback', component: MyFeedbackComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/orders', component: OrdersComponent, canActivate: [AdminAuthGuard] },
  { path: 'about', component: AboutComponent },
  { path: 'about-us', component: AboutComponent },
];
