import { cloneElement, createContext, useContext, useMemo, useState } from 'react';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

const useSheetContext = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used inside <Sheet>.');
  }
  return context;
};

export const Sheet = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
};

interface SheetTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

export const SheetTrigger = ({ children }: SheetTriggerProps) => {
  const { setOpen } = useSheetContext();

  return cloneWithOnClick(children, () => setOpen(true));
};

export const SheetContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useSheetContext();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white p-4 shadow-xl overflow-y-auto ${className}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-2 flex justify-end">
          <button className="rounded px-2 py-1 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
};

export const SheetHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={`mb-2 flex flex-col space-y-1.5 ${className}`} {...props} />;
};

export const SheetTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
};

function cloneWithOnClick(element: React.ReactElement, onClick: () => void) {
  const props = element.props as { onClick?: React.MouseEventHandler };
  return cloneElement(element, {
    ...props,
    onClick: (event: React.MouseEvent) => {
      props.onClick?.(event);
      onClick();
    },
  });
}
