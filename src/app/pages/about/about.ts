import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent {
  features = [
    {
      icon: 'bi-house-heart',
      title: 'عقارات متنوعة',
      desc: 'مزارع وشقق بمواقع مميزة تناسب جميع الأذواق والميزانيات'
    },
    {
      icon: 'bi-shield-check',
      title: 'حجز آمن',
      desc: 'نظام دفع آمن ومشفر مع ضمان استرداد الأموال عند الإلغاء'
    },
    {
      icon: 'bi-star',
      title: 'تقييمات موثوقة',
      desc: 'تقييمات حقيقية من زبائن حجزوا وأقاموا بالفعل'
    },
    {
      icon: 'bi-headset',
      title: 'دعم على مدار الساعة',
      desc: 'فريق دعم متاح 24/7 للإجابة على استفساراتك'
    },
    {
      icon: 'bi-person-check',
      title: 'ملاك موثوقون',
      desc: 'جميع الملاك خضعوا للتحقق والموافقة من قِبل فريقنا'
    },
    {
      icon: 'bi-geo-alt',
      title: 'مواقع متميزة',
      desc: 'عقارات في أفضل المواقع مع خرائط تفصيلية للوصول بسهولة'
    }
  ];

  stats = [
    { number: '500+', label: 'عقار مسجل' },
    { number: '1000+', label: 'زبون سعيد' },
    { number: '98%', label: 'نسبة الرضا' },
    { number: '24/7', label: 'دعم متواصل' }
  ];

  team = [
    { name: 'محمد أحمد', role: 'المدير التنفيذي', avatar: 'م' },
    { name: 'سارة خالد', role: 'مديرة العمليات', avatar: 'س' },
    { name: 'أحمد محمود', role: 'مدير التقنية', avatar: 'أ' }
  ];
}