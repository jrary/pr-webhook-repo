export function PageHeader({
  title,
  en,
  description,
  children,
}: {
  title: string
  en?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title}
          {en ? (
            <span className="ml-2 font-serif text-xl font-normal italic text-muted-foreground">
              {en}
            </span>
          ) : null}
        </h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  )
}
