// Helper functions for brand modal logic.
// Use by importing and calling with a component context.

export function openNavbarBrandModal(ctx: any) {
  ctx.navbarBrandModalOpen = true;
  ctx.cdr?.markForCheck?.();
}

export function closeNavbarBrandModal(ctx: any) {
  ctx.navbarBrandModalOpen = false;
  ctx.navbarBrandLogoFile = null;
  ctx.cdr?.markForCheck?.();
}

export function onNavbarBrandLogoSelected(ctx: any, event: Event) {
  const input = event?.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  ctx.navbarBrandLogoFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    ctx.navbarBrandLogoPreview = reader.result as string;
    ctx.cdr?.markForCheck?.();
  };
  reader.readAsDataURL(file);
}

export async function saveNavbarBrandSettings(ctx: any) {
  const name = (ctx.navbarBrandName || '').trim();
  const tagline = (ctx.navbarBrandTagline || '').trim();

  if (!name) {
    alert('Brand name is required');
    return;
  }

  ctx.isSavingBrand = true;
  ctx.cdr?.markForCheck?.();

  try {
    const r1 = await fetch('http://localhost:3000/api/brand/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tagline }),
    });
    const dbData = await r1.json();
    console.log('✓ Name/tagline saved to DB:', dbData);

    if (ctx.navbarBrandLogoFile) {
      const fd = new FormData();
      fd.append('logo', ctx.navbarBrandLogoFile);
      const r2 = await fetch('http://localhost:3000/api/brand/settings/logo', {
        method: 'POST',
        body: fd,
      });
      const logoResp = await r2.json();
      if (logoResp?.logoUrl) {
        console.log('✓ Logo saved to DB:', logoResp.logoUrl);
      }
    }

    ctx.isSavingBrand = false;
    ctx.showSuccessMessage?.('✓ Brand updated successfully!');
    closeNavbarBrandModal(ctx);
    window.dispatchEvent(new Event('brand-updated'));
    ctx.cdr?.markForCheck?.();
  } catch (err) {
    console.error('✗ Error saving brand:', err);
    ctx.isSavingBrand = false;
    ctx.showSuccessMessage?.('✗ Error saving brand');
    ctx.cdr?.markForCheck?.();
  }
}
