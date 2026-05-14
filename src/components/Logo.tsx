export default function Logo({ 
  className = "w-full h-full", 
  showText = true, 
  variant = 'full',
  forceWhite = false
}: { 
  className?: string; 
  showText?: boolean; 
  variant?: 'full' | 'icon';
  forceWhite?: boolean;
}) {
  const isIconOnly = variant === 'icon' || !showText;

  if (isIconOnly) {
    return (
      <img 
        src="/logo.svg" 
        alt="Mainetti Logo Icon" 
        className={`object-cover object-left ${className}`}
        style={forceWhite ? { filter: 'brightness(0) invert(1) contrast(100%)' } : undefined}
      />
    );
  }

  return (
    <img 
      src="/logo.svg" 
      alt="Mainetti Logo" 
      className={`object-contain ${className}`}
      style={forceWhite ? { filter: 'brightness(0) invert(1) contrast(100%)' } : undefined}
    />
  );
}
