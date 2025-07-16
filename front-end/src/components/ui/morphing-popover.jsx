'use client';;
import {
  useState,
  useId,
  useRef,
  useEffect,
  createContext,
  useContext,
  isValidElement,
} from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import useClickOutside from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils';

const TRANSITION = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.4,
};

const MorphingPopoverContext =
  createContext(null);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  };

  const close = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  };

  return { isOpen, open, close, uniqueId };
}

function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className,
  ...props
}) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <MotionConfig transition={transition}>
        <div
          className={cn('relative flex items-center justify-center', className)}
          key={popoverLogic.uniqueId}
          {...props}>
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

function MorphingPopoverTrigger({
  children,
  className,
  asChild = false,
  ...props
}) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error('MorphingPopoverTrigger must be used within MorphingPopover');
  }

  if (asChild && isValidElement(children)) {
    const MotionComponent = motion.create(children.type);
    const childProps = children.props;

    return (
      <MotionComponent
        {...childProps}
        onClick={context.open}
        layoutId={`popover-trigger-${context.uniqueId}`}
        className={childProps.className}
        key={context.uniqueId}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`} />
    );
  }

  return (
    <motion.div
      key={context.uniqueId}
      layoutId={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}>
      <motion.button
        {...props}
        layoutId={`popover-label-${context.uniqueId}`}
        key={context.uniqueId}
        className={className}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}>
        {children}
      </motion.button>
    </motion.div>
  );
}

function MorphingPopoverContent({
  children,
  className,
  ...props
}) {
  const context = useContext(MorphingPopoverContext);
  if (!context)
    throw new Error('MorphingPopoverContent must be used within MorphingPopover');

  const ref = useRef(null);
  useClickOutside(ref, context.close);

  useEffect(() => {
    if (!context.isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') context.close();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context.isOpen, context.close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <>
          <motion.div
            {...props}
            ref={ref}
            layoutId={`popover-trigger-${context.uniqueId}`}
            key={context.uniqueId}
            id={`popover-content-${context.uniqueId}`}
            role='dialog'
            aria-modal='true'
            className={cn(
              'absolute overflow-hidden rounded-md border border-zinc-950/10 bg-white p-2 text-zinc-950 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50',
              className
            )}
            initial='initial'
            animate='animate'
            exit='exit'
            variants={context.variants}>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
