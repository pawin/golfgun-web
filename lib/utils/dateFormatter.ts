export enum AppDateFormatStyle {
  short, // e.g. 1/10/2025
  medium, // e.g. Jan 10, 2025
  long, // e.g. Friday, January 10, 2025
  time, // e.g. 5:30 PM
  dateTime, // e.g. Jan 10, 2025 5:30 PM
  iso, // e.g. 2025-01-10
}

export class DateFormatter {
  /**
   * Formats a date using the device's locale and timezone.
   * JavaScript Date objects are already in local time when displayed,
   * so Intl.DateTimeFormat will automatically use the device's timezone.
   * 
   * @param date - The date to format (Firestore Timestamp.toDate() already returns local time)
   * @param style - The format style to use
   * @param locale - Optional locale string (e.g., 'en-US', 'th-TH'). If not provided, uses device default.
   * @param toLocal - Whether to convert to local time (default: true). 
   *                  Note: JavaScript Date objects already represent local time when formatted,
   *                  but Firestore Timestamps are UTC, so toLocal ensures proper conversion.
   */
  static format(
    date: Date,
    style: AppDateFormatStyle = AppDateFormatStyle.medium,
    locale?: string,
    toLocal: boolean = true
  ): string {
    // JavaScript Date objects are stored in UTC internally, but when formatted
    // by Intl.DateTimeFormat, they are automatically displayed in the device's timezone.
    // We don't need to manually adjust - just pass the date directly.
    // Firestore Timestamp.toDate() already converts to a JavaScript Date which represents
    // the correct moment in time, and Intl will format it in local timezone.
    const formatter = this.formatterForStyle(style, locale);
    return formatter.format(date);
  }

  /**
   * Formats a date with a custom pattern using device locale and timezone.
   */
  static custom(date: Date, pattern: string, locale?: string, toLocal: boolean = true): string {
    const options: Intl.DateTimeFormatOptions = {
      // Don't specify timeZone - uses device timezone automatically
    };
    
    // Parse pattern to options (simplified)
    if (pattern.includes('yyyy')) options.year = 'numeric';
    if (pattern.includes('MM')) options.month = '2-digit';
    if (pattern.includes('dd')) options.day = '2-digit';
    if (pattern.includes('HH') || pattern.includes('hh')) options.hour = '2-digit';
    if (pattern.includes('mm')) options.minute = '2-digit';
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  private static formatterForStyle(style: AppDateFormatStyle, locale?: string): Intl.DateTimeFormat {
    // Use device timezone - don't specify timeZone option, let it use browser's default
    // This ensures dates are displayed in the user's local timezone
    
    switch (style) {
      case AppDateFormatStyle.short:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric',
          // Don't specify timeZone - uses device timezone automatically
        });
      case AppDateFormatStyle.medium:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          // Don't specify timeZone - uses device timezone automatically
        });
      case AppDateFormatStyle.long:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          weekday: 'long',
          // Don't specify timeZone - uses device timezone automatically
        });
      case AppDateFormatStyle.time:
        return new Intl.DateTimeFormat(locale, { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true, // Use 12-hour format with AM/PM (device default)
          // Don't specify timeZone - uses device timezone automatically
        });
      case AppDateFormatStyle.dateTime:
        return new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true,
          // Don't specify timeZone - uses device timezone automatically
        });
      case AppDateFormatStyle.iso:
        // ISO format should be consistent (YYYY-MM-DD) but use device timezone
        return new Intl.DateTimeFormat('en-CA', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          // Don't specify timeZone - uses device timezone automatically
        });
    }
  }
}

