'use client'

import { CaretRight, ArrowSquareOut } from 'phosphor-react'

interface ProfileRowProps {
  label: string
  value?: string
  tappable?: boolean
  isAction?: boolean
  externalLink?: boolean
  onClick?: () => void
  isLast?: boolean
  valueNode?: React.ReactNode
}

export default function ProfileRow({
  label,
  value,
  tappable,
  isAction,
  externalLink,
  onClick,
  isLast,
  valueNode,
}: ProfileRowProps) {
  const isInteractive = tappable || isAction || externalLink

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={[
        'h-[52px] flex items-center justify-between px-4',
        isLast ? '' : 'border-b border-border',
        isInteractive
          ? 'cursor-pointer hover:bg-surface-gray transition-colors focus:outline-none focus:bg-surface-gray'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={`text-[14px] ${isAction ? 'text-brand-primary font-medium' : 'text-secondary'}`}
      >
        {label}
      </span>

      <div className="flex items-center gap-2">
        {valueNode ? (
          valueNode
        ) : value ? (
          <span className="text-[15px] text-primary">{value}</span>
        ) : null}

        {externalLink && (
          <ArrowSquareOut size={16} className="text-secondary flex-shrink-0" />
        )}
        {tappable && !externalLink && (
          <CaretRight size={16} className="text-secondary flex-shrink-0" />
        )}
        {isAction && !externalLink && (
          <CaretRight size={16} className="text-brand-primary flex-shrink-0" />
        )}
      </div>
    </div>
  )
}
