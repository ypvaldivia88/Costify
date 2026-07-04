'use client';

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface HorizontalScrollProps<T extends ElementType = 'div'> {
  as?: T;
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll<T extends ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: HorizontalScrollProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof HorizontalScrollProps<T>>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const el = ref.current;
      const drag = dragRef.current;
      if (!drag.active || !el) return;

      const delta = event.pageX - drag.startX;
      if (Math.abs(delta) > 4) {
        drag.moved = true;
      }
      if (drag.moved) {
        event.preventDefault();
        el.scrollLeft = drag.scrollLeft - delta;
      }
    };

    const endDrag = () => {
      const el = ref.current;
      dragRef.current.active = false;
      if (el) {
        el.style.cursor = '';
        el.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || event.button !== 0) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.pageX,
      scrollLeft: el.scrollLeft,
    };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn('overflow-x-auto scrollbar-none cursor-grab active:cursor-grabbing', className)}
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      {...props}
    >
      {children}
    </Tag>
  );
}
