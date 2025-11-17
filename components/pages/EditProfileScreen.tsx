'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { AppUser } from '@/lib/models/appUser';
import { getInitials, colorFromName, sanitizeUsername } from '@/lib/utils/validator';
import { resizeAndCropImageBytes } from '@/lib/utils/image_helper';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function EditProfileScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [name, setName] = useState('');
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !loading) {
      loadUser();
    }
  }, [user, loading]);

  const loadUser = async () => {
    if (!user) return;
    try {
      const userData = await userService.getUserById(user.uid);
      if (userData !== null && userData !== undefined) {
        setAppUser(userData);
        setName(userData.name);
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const processedBytes = await resizeAndCropImageBytes(bytes);
      setImageBytes(processedBytes);
      setShowImageSourceDialog(false);
    } catch (e) {
      alert(t('failedToProcessImage', { error: (e as Error).toString() }));
    }
  };

  const handleRemovePhoto = () => {
    setImageBytes(null);
    setShowImageSourceDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user || !appUser) return;

    const validationError = sanitizeUsername(name);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const username = name.trim().toLowerCase();
      await userService.updateProfile({
        username,
        imageBytes: imageBytes || undefined,
      });

      router.push(`/${locale}`);
    } catch (e) {
      alert(t('failedToUpdate', { error: (e as Error).toString() }));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !appUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const displayImage = imageBytes
    ? URL.createObjectURL(
        // @ts-ignore - Uint8Array works with Blob constructor (same pattern used in image_helper.ts)
        new Blob([imageBytes], { type: 'image/jpeg' })
      )
    : appUser.pictureUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold">{t('editProfile')}</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-32 h-32">
              {displayImage ? (
                <AvatarImage src={displayImage} alt={appUser.name} />
              ) : null}
              <AvatarFallback
                style={{ backgroundColor: colorFromName(appUser.name) }}
                className="text-white font-bold text-4xl"
              >
                {getInitials(appUser.name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setShowImageSourceDialog(true)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white border-4 border-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="w-5 h-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M149.1 64.01C164.9 64.01 179.2 72.63 187.2 86.05L205.5 116.0H306.5L324.8 86.05C332.8 72.63 347.1 64.01 362.9 64.01H400C426.5 64.01 448 85.49 448 112V128H464C490.5 128 512 149.5 512 176V400C512 426.5 490.5 448 464 448H48C21.49 448 0 426.5 0 400V176C0 149.5 21.49 128 48 128H64V112C64 85.49 85.49 64.01 112 64.01H149.1zM256 400C318.3 400 368 350.3 368 288C368 225.7 318.3 176 256 176C193.7 176 144 225.7 144 288C144 350.3 193.7 400 256 400zM256 352C220.7 352 192 323.3 192 288C192 252.7 220.7 224 256 224C291.3 224 320 252.7 320 288C320 323.3 291.3 352 256 352z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">{t('tapToChangePhoto')}</p>
        </div>

        {/* Username Input */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('username')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('enterYourUsername')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:bg-gray-400"
        >
          {isSaving ? '...' : t('saveProfile')}
        </button>
      </div>

      {/* Image Source Dialog */}
      {showImageSourceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-lg w-full p-4">
            <h2 className="text-lg font-bold mb-4">{t('choosePhoto')}</h2>
            <div className="space-y-3">
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="px-4 py-3 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50">
                  {t('chooseFromGallery')}
                </div>
              </label>
              {imageBytes && (
                <button
                  onClick={handleRemovePhoto}
                  className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  {t('removePhoto')}
                </button>
              )}
              <button
                onClick={() => setShowImageSourceDialog(false)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

