import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Splash } from '../elements/Splash';
import { computeLayerDelta, normalizeLayers, toNumber } from '../utils/layerPricing';
import { FoodLabelChips } from './FoodLabelChips';
import { effectiveLabels, labelsForOption } from '../utils/foodLabels';

const formatEuro = (value) => `${toNumber(value).toFixed(2).replace('.', ',')} €`;

const StepDots = ({ steps, current }) => (
  <div className="flex items-center gap-1.5">
    {steps.map((_, i) => (
      <span
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? 22 : 6,
          height: 6,
          background:
            i <= current ? 'var(--holi-purple)' : 'rgba(109,40,217,0.2)',
        }}
      />
    ))}
  </div>
);

const SummaryChip = ({ name }) => (
  <span
    className="inline-flex items-center gap-1.5 mr-1 mb-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
    style={{ background: 'rgba(109,40,217,0.08)', color: 'var(--holi-purple-ink)' }}
  >
    {name}
  </span>
);

const OptionRow = ({ opt, count, isSingle, addDisabled, onAdd, onRemove }) => {
  const isSelected = count > 0;
  const { allergens, additives } = labelsForOption(opt);
  const hasLabels = allergens.length > 0 || additives.length > 0;
  return (
    <div
      className="rounded-2xl mb-2 overflow-hidden transition-all"
      style={{
        background: isSelected ? 'var(--holi-purple)' : 'white',
        color: isSelected ? 'white' : 'var(--holi-ink)',
        border: `1px solid ${isSelected ? 'var(--holi-purple)' : 'rgba(109,40,217,0.15)'}`,
        boxShadow: isSelected
          ? '0 4px 14px rgba(109,40,217,0.25)'
          : '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled && !isSingle}
          className="flex-1 border-0 bg-transparent text-left flex flex-col gap-0.5 px-3.5 py-3"
          style={{
            color: 'inherit',
            cursor: addDisabled && !isSelected && !isSingle ? 'not-allowed' : 'pointer',
            opacity: addDisabled && !isSelected && !isSingle ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-2">
            {!isSingle && count > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
              >
                ×{count}
              </span>
            )}
            {isSingle && (
              <span
                className="rounded-full transition-all flex-shrink-0"
                style={{
                  width: 16,
                  height: 16,
                  border: isSelected
                    ? '5px solid white'
                    : '2px solid rgba(109,40,217,0.4)',
                  background: isSelected ? 'var(--holi-saffron)' : 'transparent',
                }}
              />
            )}
            <span className="text-sm font-semibold font-Fraunces">{opt.name}</span>
            <span className="flex-1" />
            {opt.priceDelta > 0 && (
              <span
                className="text-xs font-semibold"
                style={{ color: isSelected ? 'white' : 'var(--holi-purple-ink)' }}
              >
                +{formatEuro(opt.priceDelta)}
              </span>
            )}
          </div>
          {opt.hint && (
            <div
              className="text-[11px]"
              style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--holi-ink-soft)' }}
            >
              {opt.hint}
            </div>
          )}
          {hasLabels && (
            <div
              className="mt-1"
              style={{
                // In selected (purple) state we tint the chip backgrounds via
                // mix-blend so the amber/blue stays readable on dark purple.
                filter: isSelected ? 'brightness(1.15) saturate(1.2)' : 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <FoodLabelChips allergens={allergens} additives={additives} />
            </div>
          )}
        </button>
        {!isSingle && count > 0 && (
          <button
            type="button"
            onClick={onRemove}
            className="border-0 text-white w-11 cursor-pointer text-xl font-bold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            aria-label="Eins weniger"
          >
            −
          </button>
        )}
      </div>
    </div>
  );
};

export const LayeredSelectionSheet = ({ open, onOpenChange, product, layers: rawLayers, onConfirm }) => {
  const layers = useMemo(() => normalizeLayers(rawLayers), [rawLayers]);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    if (open) {
      setStep(0);
      setSelections({});
    }
  }, [open, product?.id]);

  if (!product || layers.length === 0) return null;

  const currentLayer = layers[step];
  const picks = selections[currentLayer.id] || [];
  const remaining = Math.max(0, currentLayer.maxSelections - picks.length);
  const canProceed =
    picks.length >= currentLayer.minSelections &&
    picks.length <= currentLayer.maxSelections;
  const isLastStep = step === layers.length - 1;

  const togglePick = (optionId) => {
    setSelections((prev) => {
      const current = prev[currentLayer.id] ? [...prev[currentLayer.id]] : [];
      if (currentLayer.maxSelections === 1) {
        const already = current[0]?.optionId === optionId;
        return { ...prev, [currentLayer.id]: already ? [] : [{ optionId }] };
      }
      if (current.length >= currentLayer.maxSelections) return prev;
      return { ...prev, [currentLayer.id]: [...current, { optionId }] };
    });
  };

  const removeOne = (optionId) => {
    setSelections((prev) => {
      const current = prev[currentLayer.id] ? [...prev[currentLayer.id]] : [];
      const idx = [...current].reverse().findIndex((p) => p.optionId === optionId);
      if (idx < 0) return prev;
      const realIdx = current.length - 1 - idx;
      const next = [...current];
      next.splice(realIdx, 1);
      return { ...prev, [currentLayer.id]: next };
    });
  };

  let totalDelta = 0;
  const layerNames = [];
  const completedSummary = [];
  const selectedLayersSnapshot = [];
  for (const layer of layers) {
    const lpicks = selections[layer.id] || [];
    totalDelta += computeLayerDelta(layer, lpicks);
    if (lpicks.length > 0) {
      selectedLayersSnapshot.push({ layerId: layer.id, picks: lpicks });
    }
    for (const p of lpicks) {
      const opt = layer.options.find((o) => o.id === p.optionId);
      if (opt) {
        layerNames.push(opt.name);
        completedSummary.push({ key: `${layer.id}-${p.optionId}-${completedSummary.length}`, name: opt.name });
      }
    }
  }
  const liveTotal = Number(product.price || 0) + totalDelta;
  const liveLabels = effectiveLabels(product, selectedLayersSnapshot);
  const hasLiveLabels = liveLabels.allergens.length > 0 || liveLabels.additives.length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    if (isLastStep) {
      const selectedLayers = layers
        .map((layer) => ({
          layerId: layer.id,
          picks: (selections[layer.id] || []).map((p) => ({ optionId: p.optionId })),
        }))
        .filter((l) => l.picks.length > 0);
      onConfirm({ selectedLayers, totalDelta, layerNames });
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(36, 14, 60, 0.55)', backdropFilter: 'blur(2px)' }}
        />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-3xl"
          style={{
            background: 'var(--holi-cream)',
            maxHeight: '92vh',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
          }}
        >
          <Splash color="purple" size={180} opacity={0.35} style={{ top: -70, left: -60 }} />
          <Splash color="mango" size={140} opacity={0.4} style={{ top: -50, right: -40 }} />

          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0 relative">
            <span
              className="rounded-full"
              style={{ width: 40, height: 4, background: 'rgba(109,40,217,0.25)' }}
            />
          </div>

          {/* Header */}
          <div className="px-5 pt-1 pb-2.5 flex-shrink-0 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: 'var(--holi-purple)' }}
                >
                  Schritt {step + 1} von {layers.length}
                </div>
                <Dialog.Title
                  className="font-Fraunces text-[22px] font-semibold m-0 leading-tight"
                  style={{ color: 'var(--holi-ink)' }}
                >
                  {product.nameAdvertising || product.name}{' '}
                  <span style={{ color: 'var(--holi-purple)' }}>·</span>{' '}
                  {currentLayer.name}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="border-0 w-[34px] h-[34px] rounded-full text-lg cursor-pointer flex-shrink-0 inline-flex items-center justify-center"
                  style={{ background: 'rgba(109,40,217,0.08)', color: 'var(--holi-purple-ink)' }}
                  aria-label="Schließen"
                >
                  ×
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-2.5">
              <StepDots steps={layers} current={step} />
            </div>

            {currentLayer.description && (
              <p
                className="text-[13px] leading-snug m-0 mt-2.5"
                style={{ color: 'var(--holi-ink-soft)' }}
              >
                {currentLayer.description}
              </p>
            )}

            <div
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                color: 'var(--holi-purple-ink)',
                background: 'rgba(255,255,255,0.55)',
                border: '1px dashed rgba(109,40,217,0.3)',
              }}
            >
              {currentLayer.minSelections === currentLayer.maxSelections
                ? `Wähle genau ${currentLayer.maxSelections}`
                : currentLayer.minSelections === 0
                ? `Optional · bis zu ${currentLayer.maxSelections}`
                : `${currentLayer.minSelections}–${currentLayer.maxSelections} wählen`}
              {currentLayer.maxSelections > 1 && remaining > 0 && (
                <span style={{ opacity: 0.7 }}>· noch {remaining} möglich</span>
              )}
            </div>
          </div>

          {(completedSummary.length > 0 || hasLiveLabels) && (
            <div
              className="px-5 py-2.5 flex-shrink-0 relative"
              style={{
                background: 'rgba(255,255,255,0.55)',
                borderTop: '1px solid rgba(109,40,217,0.1)',
                borderBottom: '1px solid rgba(109,40,217,0.1)',
              }}
            >
              {completedSummary.length > 0 && (
                <>
                  <div
                    className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--holi-ink-soft)' }}
                  >
                    Deine Auswahl
                  </div>
                  <div>
                    {completedSummary.map((s) => (
                      <SummaryChip key={s.key} name={s.name} />
                    ))}
                  </div>
                </>
              )}
              {hasLiveLabels && (
                <div className={completedSummary.length > 0 ? 'mt-2' : ''}>
                  <div
                    className="text-[9px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'var(--holi-ink-soft)' }}
                  >
                    Allergene & Zusatzstoffe (deine Wahl)
                  </div>
                  <FoodLabelChips
                    allergens={liveLabels.allergens}
                    additives={liveLabels.additives}
                  />
                </div>
              )}
            </div>
          )}

          {/* Options list */}
          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4 relative">
            {currentLayer.options.map((opt) => {
              const count = picks.filter((p) => p.optionId === opt.id).length;
              const isSingle = currentLayer.maxSelections === 1;
              const addDisabled = !opt.available || (remaining === 0 && !isSingle);
              return (
                <OptionRow
                  key={opt.id}
                  opt={opt}
                  count={count}
                  isSingle={isSingle}
                  addDisabled={addDisabled}
                  onAdd={() => togglePick(opt.id)}
                  onRemove={() => removeOne(opt.id)}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="flex items-center gap-2.5 px-4 pt-3 pb-5 flex-shrink-0 relative"
            style={{ borderTop: '1px solid rgba(109,40,217,0.12)', background: 'white' }}
          >
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="border px-3.5 py-3 rounded-2xl text-[13px] font-semibold cursor-pointer flex-shrink-0"
                style={{ borderColor: 'rgba(109,40,217,0.2)', color: 'var(--holi-purple-ink)', background: 'white' }}
              >
                Zurück
              </button>
            )}
            <div className="flex-1 text-left">
              <div
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: 'var(--holi-ink-soft)' }}
              >
                Gesamt
              </div>
              <div
                className="font-Fraunces text-lg font-bold"
                style={{ color: 'var(--holi-ink)' }}
              >
                {formatEuro(liveTotal)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="border-0 text-white px-5 py-3.5 rounded-2xl text-[14px] font-bold flex-shrink-0"
              style={{
                background: canProceed ? 'var(--holi-purple)' : 'rgba(109,40,217,0.25)',
                cursor: canProceed ? 'pointer' : 'not-allowed',
                boxShadow: canProceed ? '0 6px 16px rgba(109,40,217,0.4)' : 'none',
              }}
            >
              {isLastStep ? 'Hinzufügen' : 'Weiter →'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
