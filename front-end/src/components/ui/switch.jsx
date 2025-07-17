"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80",
        green: "data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-input focus-visible:border-green-600 focus-visible:ring-green-600/50 dark:data-[state=unchecked]:bg-input/80",
        whatsapp: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500/50 hover:data-[state=checked]:bg-green-600 hover:data-[state=unchecked]:bg-gray-300 transition-colors",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
  {
    variants: {
      variant: {
        default: "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
        green: "bg-white data-[state=checked]:bg-white data-[state=unchecked]:bg-white",
        whatsapp: "bg-white shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Switch({
  className,
  variant = "default",
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ variant }), className)}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ variant }))} />
    </SwitchPrimitive.Root>
  );
}

export { Switch }