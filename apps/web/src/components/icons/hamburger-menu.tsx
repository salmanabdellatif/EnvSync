interface HamburgerMenuProps {
  isOpen: boolean;
  className?: string;
}

export function HamburgerMenu({ isOpen, className }: HamburgerMenuProps) {
  return (
    <div
      className={`w-6 h-6 flex flex-col justify-center items-center ${className || ""}`}
    >
      {/* Top bar */}
      <span
        className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out ${
          isOpen ? "rotate-45 translate-y-0.5" : "-translate-y-1.5"
        }`}
      />
      {/* Middle bar */}
      <span
        className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out ${
          isOpen ? "opacity-0 scale-0" : "opacity-100"
        }`}
      />
      {/* Bottom bar */}
      <span
        className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out ${
          isOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1.5"
        }`}
      />
    </div>
  );
}
