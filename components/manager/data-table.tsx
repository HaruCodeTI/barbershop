"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Buscar...",
  onRowClick,
  emptyMessage = "Nenhum registro encontrado",
  pageSize = 25,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  // Filter data based on search
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true
    return columns.some((col) => {
      const value = row[col.key]
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === bValue) return 0

    const comparison = aValue > bValue ? 1 : -1
    return sortConfig.direction === "asc" ? comparison : -comparison
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      }
      return { key, direction: "asc" }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1) // Reset to first page on search
          }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                        column.sortable && "cursor-pointer hover:text-foreground",
                        column.className
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortConfig?.key === column.key && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/50 transition-colors",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={cn("px-4 py-3 text-sm", column.className)}>
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, sortedData.length)} de{" "}
            {sortedData.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
