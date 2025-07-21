import { Button } from "./ui/button"


interface Props {
  totalPages: number
  currentPage: number
  setCurrentPage: (page: number) => void
  filteredCount: number
}

export function Pagination({ totalPages, currentPage, setCurrentPage, filteredCount }: Props) {
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        Anterior
      </Button>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (currentPage <= 3) {
            pageNum = i + 1
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = currentPage - 2 + i
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
              className="w-10"
            >
              {pageNum}
            </Button>
          )
        })}
      </div>
      <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
        Siguiente
      </Button>
      <div className="ml-4 text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} ({filteredCount} películas)
      </div>
    </div>
  )
}
