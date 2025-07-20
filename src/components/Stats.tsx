interface Props {
    total: number;
    watched: number;
    watchLater: number;
  }
  export function Stats({ total, watched, watchLater }: Props) {
    return (
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{watched}</div>
          <div className="text-sm text-muted-foreground">Vistas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{watchLater}</div>
          <div className="text-sm text-muted-foreground">Ver Después</div>
        </div>
      </div>
    )
  }
  