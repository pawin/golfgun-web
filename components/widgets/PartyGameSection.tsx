'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Round, roundIsMember } from '@/lib/models/round';
import { SpinnerEntry } from '@/lib/models/spinnerEntry';
import { spinnerService } from '@/lib/services/spinnerService';
import { roundService } from '@/lib/services/roundService';
import { defaultWheelOptionsTh } from '@/lib/utils/party_game_defaults';
import { getInitials, colorFromName } from '@/lib/utils/validator';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';

interface PartyGameSectionProps {
  round: Round;
  currentUserId: string;
}

export default function PartyGameSection({ round, currentUserId }: PartyGameSectionProps) {
  const t = useTranslations();
  const locale = useLocale();
  const intlLocale = locale === "th" ? "th-TH" : locale === "en" ? "en-US" : undefined;
  const [user] = useAuthState(auth);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingSelectedIndex, setPendingSelectedIndex] = useState<number | null>(null);
  const [optionsCache, setOptionsCache] = useState<string[]>([]);
  const [entries, setEntries] = useState<SpinnerEntry[]>([]);
  const [showSpinnerModal, setShowSpinnerModal] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const unsubscribeEntriesRef = useRef<(() => void) | null>(null);
  const unsubscribeOptionsRef = useRef<(() => void) | null>(null);

  const isMember = roundIsMember(round, currentUserId);

  useEffect(() => {
    // Initialize options cache
    const initialOptions = round.spinnerOptions
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    setOptionsCache(initialOptions.length > 0 ? initialOptions : defaultWheelOptionsTh);

    // Watch entries
    const unsubscribeEntries = spinnerService.watchEntries(round.id, (newEntries) => {
      setEntries(newEntries);
    });
    unsubscribeEntriesRef.current = unsubscribeEntries;

    // Watch options
    const unsubscribeOptions = spinnerService.watchOptions(round.id, (newOptions) => {
      const sanitized = newOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      if (sanitized.length > 0) {
        setOptionsCache(sanitized);
      }
    });
    unsubscribeOptionsRef.current = unsubscribeOptions;

    return () => {
      unsubscribeEntries();
      unsubscribeOptions();
    };
  }, [round.id, round.spinnerOptions]);

  const resolveWheelOptions = (override?: string[]): string[] => {
    if (override && override.length > 0) {
      const sanitized = override
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      if (sanitized.length > 0) return sanitized;
    }
    if (optionsCache.length > 0) return optionsCache;
    if (round.spinnerOptions.length > 0) {
      return round.spinnerOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
    }
    return defaultWheelOptionsTh;
  };

  const options = resolveWheelOptions();

  const setPartyGameEnabled = async (enabled: boolean) => {
    if (!isMember) return;
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await roundService.setPartyGameEnabled(round.id, enabled);
      if (enabled) {
        await spinnerService.ensureOptions(round.id, options);
      }
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setIsUpdating(false);
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (options.length < 2) {
      alert(t('partyGameNoOptions'));
      return;
    }

    setIsSpinning(true);
    const selectedIndex = Math.floor(Math.random() * options.length);
    setPendingSelectedIndex(selectedIndex);

    // Animate wheel
    if (wheelRef.current) {
      const degrees = 360 * 5 + (360 / options.length) * selectedIndex;
      wheelRef.current.style.transform = `rotate(${degrees}deg)`;
      wheelRef.current.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)';
    }

    // Handle completion after animation
    setTimeout(async () => {
      const index = Math.max(0, Math.min(selectedIndex, options.length - 1));
      const option = options[index];
      const userId = user?.uid || currentUserId;
      const userName = user?.displayName || user?.email?.split('@')[0] || t('player');

      try {
        await spinnerService.logSpin({
          roundId: round.id,
          userId,
          userName,
          option,
        });
        alert(t('partyGameResultMessage').replace('{userName}', userName).replace('{option}', option));
      } catch (e) {
        console.error(e);
        alert(String(e));
      } finally {
        setIsSpinning(false);
        setPendingSelectedIndex(null);
        if (wheelRef.current) {
          wheelRef.current.style.transition = '';
        }
      }
    }, 6000);
  };

  const openOptionsEditor = () => {
    setShowOptionsEditor(true);
  };

  if (!isMember) return null;

  const decision = round.partyGameEnabled;

  if (decision === undefined) {
    return (
      <div className="p-4">
        <EnablePrompt isProcessing={isUpdating} onDecision={setPartyGameEnabled} />
      </div>
    );
  }

  if (decision !== true) return null;

  const latest = entries.length > 0 ? entries[0] : null;
  const latestDetail = latest?.createdAt
    ? `${DateFormatter.format(latest.createdAt, AppDateFormatStyle.short, intlLocale)} ${DateFormatter.format(latest.createdAt, AppDateFormatStyle.time, intlLocale)}`
    : '';
  const latestOption = latest?.option.trim() || '';
  const hasResult = latestOption.length > 0;
  const spinnerName = latest?.userName.trim() || '';
  const displayText = hasResult ? latestOption : t('partyGameSpinFirstResult');

  return (
    <div className="p-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs font-semibold text-primary mb-1">{t('partyGameWheelTitle')}</div>
            <div className="text-base font-medium">{displayText}</div>
            {hasResult && latestDetail && (
              <div className="text-xs text-muted-foreground mt-1">
                {spinnerName ? `${spinnerName} · ${latestDetail}` : latestDetail}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSpinnerModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
          >
            {t('partyGameSpin')}
          </button>
        </div>
      </div>

      {/* Spinner Modal */}
      {showSpinnerModal && (
        <SpinnerModal
          round={round}
          options={options}
          entries={entries}
          isSpinning={isSpinning}
          wheelRef={wheelRef}
          onSpin={spinWheel}
          onClose={() => setShowSpinnerModal(false)}
          onEditOptions={openOptionsEditor}
        />
      )}

      {/* Options Editor Modal */}
      {showOptionsEditor && (
        <OptionsEditorModal
          initial={options}
          onSave={async (newOptions) => {
            try {
              const sanitized = newOptions
                .map((e) => e.trim())
                .filter((e) => e.length > 0);
              await spinnerService.setOptions(round.id, sanitized);
              setOptionsCache(sanitized);
              alert(t('partyGameUpdated'));
            } catch (e) {
              console.error(e);
              alert(String(e));
            }
          }}
          onClose={() => setShowOptionsEditor(false)}
        />
      )}
    </div>
  );
}

// Enable Prompt Component
function EnablePrompt({
  isProcessing,
  onDecision,
}: {
  isProcessing: boolean;
  onDecision: (enable: boolean) => void;
}) {
  const t = useTranslations();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-base font-semibold mb-1">{t('partyGamePromptTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('partyGamePromptDescription')}</div>
        </div>
        <div className="flex gap-2 ml-3">
          <button
            onClick={() => onDecision(false)}
            disabled={isProcessing}
            className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent/20 disabled:opacity-50"
          >
            {t('partyGameDisable')}
          </button>
          <button
            onClick={() => onDecision(true)}
            disabled={isProcessing}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            )}
            {t('partyGameEnable')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Spinner Modal Component
function SpinnerModal({
  round,
  options,
  entries,
  isSpinning,
  wheelRef,
  onSpin,
  onClose,
  onEditOptions,
}: {
  round: Round;
  options: string[];
  entries: SpinnerEntry[];
  isSpinning: boolean;
  wheelRef: React.RefObject<HTMLDivElement | null>;
  onSpin: () => void;
  onClose: () => void;
  onEditOptions: () => void;
}) {
  const t = useTranslations();

  const segmentClasses = (index: number) =>
    index % 2 === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground';

  const anglePerSegment = 360 / options.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('partyGameWheelTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Wheel */}
          <div className="flex justify-center mb-4">
            {options.length < 2 ? (
              <div className="w-80 h-80 flex items-center justify-center text-center text-muted-foreground">
                {t('partyGameNoOptions')}
              </div>
            ) : (
              <div className="relative w-80 h-80">
                {/* Wheel */}
                <div
                  ref={wheelRef}
                  className="relative w-full h-full rounded-full border-4 border-background shadow-lg overflow-hidden"
                  style={{ transform: 'rotate(0deg)' }}
                >
                  {options.map((option, index) => {
                    const startAngle = index * anglePerSegment;
                    return (
                      <div
                        key={index}
                        className={`absolute inset-0 ${segmentClasses(index)}`}
                        style={{
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.sin((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((startAngle + anglePerSegment) * Math.PI) / 180)}% ${50 - 50 * Math.sin(((startAngle + anglePerSegment) * Math.PI) / 180)}%)`,
                        }}
                      >
                        <div
                          className="absolute"
                          style={{
                            left: '50%',
                            top: '10%',
                            transform: `translateX(-50%) rotate(${startAngle + anglePerSegment / 2}deg)`,
                            transformOrigin: '50% 40%',
                            color: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            textAlign: 'center',
                            width: '80px',
                          }}
                        >
                          {option}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-foreground" />
              </div>
            )}
          </div>

          {/* Spin Button */}
          <button
            onClick={onSpin}
            disabled={isSpinning || options.length < 2}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {isSpinning ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {t('partyGameSpinning')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('partyGameSpin')}
              </>
            )}
          </button>

          {/* Edit Options Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onEditOptions}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              {t('partyGameEditOptions')}
            </button>
          </div>

          {/* History */}
          <div className="border-t border-border pt-4">
            {entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">{t('partyGameHistoryEmpty')}</div>
            ) : (
              <div className="space-y-0">
                {entries.map((entry, index) => {
                  const displayName = entry.userName.trim() || '?';
                  const initials = getInitials(displayName);
                  const bgColor = colorFromName(displayName);
                  const timestamp = entry.createdAt;
                  const subtitle = timestamp
                    ? ""//`${entry.userName} · ${DateFormatter.format(timestamp, AppDateFormatStyle.short, intlLocale)} ${DateFormatter.format(timestamp, AppDateFormatStyle.time, intlLocale)}`
                    : entry.userName;
                  const opacity = index === 0 ? 1.0 : 0.5;

                  return (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 border-b border-border`} style={{ opacity }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm"
                        style={{ backgroundColor: bgColor }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{entry.option}</div>
                        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Options Editor Modal Component
function OptionsEditorModal({
  initial,
  onSave,
  onClose,
}: {
  initial: string[];
  onSave: (options: string[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const initialOptions = initial.length > 0 ? initial : defaultWheelOptionsTh.slice(0, 6);
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addOption = () => {
    setOptions([...options, '']);
    setErrorMessage(null);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    setErrorMessage(null);
  };

  const handleSave = () => {
    const values = options
      .map((o) => o.trim())
      .filter((text) => text.length > 0);
    const deduped = new Set(values);
    const result = Array.from(deduped);

    if (result.length < 2) {
      setErrorMessage(t('partyGameOptionsValidation'));
      return;
    }

    onSave(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-card rounded-t-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('partyGameEditOptions')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-muted-foreground mb-3">{t('partyGameOptionsHint')}</p>

          <div className="space-y-3 mb-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`${t('partyGameAddOption')} ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 1}
                  className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addOption}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('partyGameAddOption')}
          </button>

          {errorMessage && <div className="text-xs text-destructive mb-4">{errorMessage}</div>}

          <button
            onClick={handleSave}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            {t('partyGameSaveOptions')}
          </button>
        </div>
      </div>
    </div>
  );
}

