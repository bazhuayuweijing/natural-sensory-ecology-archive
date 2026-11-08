import { useEffect, useRef, useState } from "react";

/**
 * 数字滚动动画 hook
 * @param target 目标数值
 * @param duration 动画时长(ms)，默认 1500
 * @param start 是否立即开始，默认 true；传 false 可由调用方控制触发时机
 */
export function useCountUp(target: number, duration = 1500, start = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    const animate = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic 缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
    };
  }, [target, duration, start]);

  return value;
}
