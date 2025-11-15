export enum AppDateFormatStyle {
  short, // e.g. 1/10/2025
  medium, // e.g. Jan 10, 2025
  long, // e.g. Friday, January 10, 2025
  time, // e.g. 5:30 PM
  dateTime, // e.g. Jan 10, 2025 5:30 PM
  iso, // e.g. 2025-01-10
}

export class DateFormatter {
  static format(
    date: Date,
    style: AppDateFormatStyle = AppDateFormatStyle.medium,
    locale?: string,
    toLocal: boolean = true
  ): string {
    const resolvedDate = toLocal ? new Date(date.getTime() - date.getTimezoneOffset() * 60000) : date;
    const formatter = this.formatterForStyle(style, locale);
    return formatter.format(resolvedDate);
  }

  static custom(date: Date, pattern: string, locale?: string, toLocal: boolean = true): string {
    const resolvedDate = toLocal ? new Date(date.getTime() - date.getTimezoneOffset() * 60000) : date;
    const options: Intl.DateTimeFormatOptions = {};
    
    // Parse pattern to options (simplified)
    if (pattern.includes('yyyy')) options.year = 'numeric';
    if (pattern.includes('MM')) options.month = '2-digit';
    if (pattern.includes('dd')) options.day = '2-digit';
    if (pattern.includes('HH') || pattern.includes('hh')) options.hour = '2-digit';
    if (pattern.includes('mm')) options.minute = '2-digit';
    
    return new Intl.DateTimeFormat(locale, options).format(resolvedDate);
  }

  private static formatterForStyle(style: AppDateFormatStyle, locale?: string): Intl.DateTimeFormat {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (style) {
      case AppDateFormatStyle.short:
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' });
      case AppDateFormatStyle.medium:
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
      case AppDateFormatStyle.long:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          weekday: 'long' 
        });
      case AppDateFormatStyle.time:
        return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
      case AppDateFormatStyle.dateTime:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      case AppDateFormatStyle.iso:
        return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
  }
}

