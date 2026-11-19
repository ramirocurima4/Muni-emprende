"use client";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChefHat,
  Hammer,
  Laptop,
  Layers,
  Loader2,
  Package,
  Spool,
  Sprout,
  Store,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compressImageFileForUpload } from "@/lib/client/image-compress";
import type {
  PanelCategoryItem,
  PanelProductItem,
} from "@/lib/server/entrepreneur-panel";

interface ProductWizardModalProps {
  mode: "create" | "edit";
  initialProduct?: PanelProductItem | null;
  categories: PanelCategoryItem[];
  isTrusted: boolean;
  onClose: () => void;
  onSaved: (result: {
    product: PanelProductItem;
    publishedDirectly: boolean;
    mode: "create" | "edit";
  }) => void;
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "gastronomia":
      return ChefHat;
    case "artesanias-y-decoracion":
      return Hammer;
    case "textil-e-indumentaria":
      return Spool;
    case "vivero-y-jardineria":
      return Sprout;
    case "servicios":
      return Wrench;
    case "tecnologia":
      return Laptop;
    default:
      return Store;
  }
}

export function ProductWizardModal({
  mode,
  initialProduct,
  categories,
  isTrusted,
  onClose,
  onSaved,
}: ProductWizardModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === "edit" && Boolean(initialProduct);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    isEdit ? (initialProduct?.image?.fullUrl ?? null) : null,
  );
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const [title, setTitle] = useState(isEdit ? (initialProduct?.title ?? "") : "");
  const [categoryId, setCategoryId] = useState(
    isEdit
      ? (initialProduct?.category.id ?? categories[0]?.id ?? "")
      : (categories[0]?.id ?? ""),
  );
  const [description, setDescription] = useState(
    isEdit ? (initialProduct?.description ?? "") : "",
  );
  const [isCombo, setIsCombo] = useState<boolean>(
    isEdit ? Boolean(initialProduct?.isCombo) : false,
  );
  const [ingredients, setIngredients] = useState(
    isEdit ? (initialProduct?.ingredients ?? "") : "",
  );

  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const showIngredientsField = isCombo || Boolean(selectedCategory?.isGastronomy);

  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const rawFile = event.target.files?.[0];
    event.target.value = "";
    if (!rawFile) return;

    setStepError(null);
    setIsCompressingPhoto(true);

    try {
      const compressed = await compressImageFileForUpload(rawFile, {
        maxDimension: 1200,
        quality: 0.82,
        fileNamePrefix: "producto",
      });

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setStepError(
        "No pudimos leer esa foto. Probá eligiendo otra imagen del celular.",
      );
    } finally {
      setIsCompressingPhoto(false);
    }
  }

  function handleNextFromStep1() {
    if (!previewUrl) {
      setStepError("Primero elegí una foto de tu producto.");
      return;
    }
    setStepError(null);
    setStep(2);
  }

  function handleNextFromStep2() {
    if (title.trim().length < 3) {
      setStepError("Escribí el nombre del producto (al menos 3 letras).");
      return;
    }
    if (!categoryId) {
      setStepError("Elegí un rubro para tu producto.");
      return;
    }
    setStepError(null);
    setStep(3);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      handleNextFromStep1();
      return;
    }

    if (step === 2) {
      handleNextFromStep2();
      return;
    }

    setStepError(null);

    if (description.trim().length < 10) {
      setStepError(
        "Contanos un poquito más sobre tu producto (al menos 10 letras).",
      );
      return;
    }

    if (mode === "create" && !selectedFile) {
      setStep(1);
      setStepError("Falta subir la foto de tu producto.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.set("title", title.trim());
      body.set("categoryId", categoryId);
      body.set("description", description.trim());
      body.set("isCombo", isCombo ? "true" : "false");
      body.set("ingredients", showIngredientsField ? ingredients.trim() : "");
      if (selectedFile) {
        body.set("image", selectedFile);
      }

      const endpoint =
        mode === "edit" && initialProduct
          ? `/api/mi-emprendimiento/productos/${initialProduct.id}`
          : "/api/mi-emprendimiento/productos";

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        body,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ?? "No pudimos guardar el producto. Intentá de nuevo.",
        );
      }

      onSaved({
        product: data.product,
        publishedDirectly: Boolean(data.publishedDirectly),
        mode,
      });
    } catch (err) {
      setStepError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar. Probá de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-[32px]">
        {/* Cabecera celeste pastel */}
        <div className="border-b border-brand-sky/30 bg-[#E8F1F8] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-sky-dark">
                Paso {step} de 3
              </p>
              <h3
                id="wizard-modal-title"
                className="text-lg font-extrabold text-brand-ink sm:text-xl"
              >
                {mode === "edit" ? "Editar Producto" : "Subir Nuevo Producto"}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar formulario"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-ink shadow-xs transition-colors hover:bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Barra de progreso simple */}
          <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-2 rounded-full transition-colors ${
                  item <= step ? "bg-brand-green" : "bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenido paso a paso */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
        >
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-extrabold text-brand-ink">
                  1. Foto del producto
                </h4>
                <p className="mt-1 text-sm text-brand-muted">
                  Elegí una foto donde se vea bien lo que ofrecés. La achicamos
                  automáticamente para que suba rápido.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className="sr-only"
                aria-label="Seleccionar foto del producto"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressingPhoto}
                className="group relative flex min-h-[230px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-brand-sky bg-[#E8F1F8]/55 p-4 text-center transition-colors hover:border-brand-green hover:bg-[#E8F1F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Vista previa del producto"
                      className="max-h-60 w-auto rounded-2xl object-contain shadow-md"
                    />
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-green-dark shadow-sm">
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      <span>Tocar para cambiar la foto</span>
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/20">
                      {isCompressingPhoto ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        <Camera className="h-7 w-7" />
                      )}
                    </span>
                    <div>
                      <p className="text-base font-extrabold text-brand-ink">
                        {isCompressingPhoto
                          ? "Preparando foto..."
                          : "Tocar acá para elegir una foto"}
                      </p>
                      <p className="mt-1 text-xs text-brand-muted">
                        Podés sacarla ahora o elegir una de tu galería
                      </p>
                    </div>
                  </div>
                )}
              </button>

              {selectedFile ? (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-green-dark">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Foto optimizada para subir con pocos datos</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-extrabold text-brand-ink">
                  2. Tipo, Título y Rubro
                </h4>
                <p className="mt-1 text-sm text-brand-muted">
                  Sin precios: los vecinos te consultan directo por WhatsApp.
                </p>
              </div>

              {/* Selector Producto Individual vs Combo / Lista de variedades */}
              <div>
                <span className="block text-sm font-bold text-brand-ink">
                  ¿Qué estás subiendo? *
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIsCombo(false)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                      !isCombo
                        ? "border-brand-green bg-brand-green-soft text-brand-green-dark shadow-xs"
                        : "border-brand-sky/30 bg-[#FDFBF7] text-brand-ink hover:border-brand-sky"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        !isCombo
                          ? "bg-brand-green text-white"
                          : "bg-white text-brand-sky-dark"
                      }`}
                    >
                      <Package className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="block text-sm font-extrabold leading-snug">
                        Producto individual
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-brand-muted">
                        Un artículo o plato específico
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCombo(true)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                      isCombo
                        ? "border-brand-green bg-brand-green-soft text-brand-green-dark shadow-xs"
                        : "border-brand-sky/30 bg-[#FDFBF7] text-brand-ink hover:border-brand-sky"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isCombo
                          ? "bg-brand-green text-white"
                          : "bg-white text-brand-sky-dark"
                      }`}
                    >
                      <Layers className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="block text-sm font-extrabold leading-snug">
                        Combo / Lista de variedades
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-brand-muted">
                        Foto grupal o flyer con varios sabores u opciones
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="wizard-product-title"
                  className="block text-sm font-bold text-brand-ink"
                >
                  {isCombo
                    ? "Título del combo o publicación *"
                    : "Título del producto *"}
                </label>
                <input
                  id="wizard-product-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNextFromStep2();
                    }
                  }}
                  placeholder={
                    isCombo
                      ? "Ej: Empanadas caseras por docena (varios sabores)"
                      : "Ej: Docena de chipá casero"
                  }
                  className="mt-1.5 min-h-[50px] w-full rounded-2xl border border-brand-sky/40 bg-[#FDFBF7] px-4 py-3 text-base text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25"
                />
              </div>

              <div>
                <span className="block text-sm font-bold text-brand-ink">
                  ¿En qué rubro va? *
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.slug);
                    const isSelected = cat.id === categoryId;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex min-h-[54px] items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                          isSelected
                            ? "border-brand-green bg-brand-green-soft text-brand-green-dark shadow-xs"
                            : "border-brand-sky/30 bg-[#FDFBF7] text-brand-ink hover:border-brand-sky hover:bg-[#E8F1F8]/60"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-brand-green text-white"
                              : "bg-white text-brand-sky-dark"
                          }`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-extrabold text-brand-ink">
                  3. Descripción
                  {isCombo
                    ? " y Variedades"
                    : showIngredientsField
                      ? " e Ingredientes"
                      : ""}
                </h4>
                <p className="mt-1 text-sm text-brand-muted">
                  Contá lo necesario para que el vecino sepa qué ofrecés.
                </p>
              </div>

              <div>
                <label
                  htmlFor="wizard-product-description"
                  className="block text-sm font-bold text-brand-ink"
                >
                  Descripción *
                </label>
                <textarea
                  id="wizard-product-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Recién horneados cada mañana. Se encargan por docena o media docena."
                  className="mt-1.5 w-full rounded-2xl border border-brand-sky/40 bg-[#FDFBF7] px-4 py-3 text-base text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25"
                />
              </div>

              {showIngredientsField ? (
                <div className="rounded-2xl border border-[#F5A623]/40 bg-[#FEF3DC]/70 p-4">
                  <label
                    htmlFor="wizard-product-ingredients"
                    className="block text-sm font-bold text-brand-ink"
                  >
                    {isCombo
                      ? "Variedades o qué incluye"
                      : "Ingredientes (opcional · Gastronomía)"}
                  </label>
                  <p className="mt-0.5 text-xs text-[#78350F]">
                    {isCombo
                      ? "Separalas con comas para que los vecinos vean todas las opciones disponibles."
                      : "Ideal para que quien compra sepa qué lleva tu comida."}
                  </p>
                  <textarea
                    id="wizard-product-ingredients"
                    rows={2}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder={
                      isCombo
                        ? "Ej: Carne, Pollo, Jamón y queso"
                        : "Ej: Almidón de mandioca, queso criollo, huevo y manteca."
                    }
                    className="mt-2 w-full rounded-xl border border-[#F5A623]/40 bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/25"
                  />
                </div>
              ) : null}

              {mode === "edit" && !isTrusted ? (
                <p className="rounded-2xl border border-[#F5A623]/40 bg-[#FEF3DC] px-4 py-3 text-xs font-semibold leading-relaxed text-[#78350F]">
                  Al guardar cambios, el producto vuelve a revisión de la Muni
                  antes de actualizarse en el catálogo.
                </p>
              ) : null}
            </div>
          ) : null}

          {stepError ? (
            <div
              role="alert"
              className="rounded-2xl border border-[#D98282] bg-[#FDF2F2] px-4 py-3 text-sm font-bold text-[#7A1C1C]"
            >
              {stepError}
            </div>
          ) : null}

          {/* Botones de navegación del paso a paso */}
          <div className="flex items-center gap-3 pt-2">
            {step > 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setStepError(null);
                  setStep(step === 3 ? 2 : 1);
                }}
                className="inline-flex min-h-[52px] items-center justify-center gap-1.5 rounded-2xl border border-brand-sky/40 bg-[#E8F1F8] px-4 py-3 text-sm font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Atrás</span>
              </button>
            ) : null}

            {step < 3 ? (
              <button
                key="wizard-next-step"
                type="button"
                disabled={isCompressingPhoto}
                onClick={step === 1 ? handleNextFromStep1 : handleNextFromStep2}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3 text-base font-extrabold text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green-hover disabled:opacity-60"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                key="wizard-submit"
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3 text-base font-extrabold text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green-hover disabled:opacity-65"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>
                    {mode === "edit"
                      ? "Guardar cambios"
                      : isTrusted
                        ? "Publicar producto"
                        : "Enviar producto"}
                  </span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
