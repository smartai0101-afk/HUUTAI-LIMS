"use client";



import { Fragment, ReactNode, useMemo } from "react";



interface Column<T> {

  key: keyof T;

  header: string;

  render?: (value: T[keyof T], row: T) => ReactNode;

}



interface RowSelection<T> {

  getRowId: (row: T) => string;

  selectedIds: Set<string>;

  onSelectedIdsChange: (ids: Set<string>) => void;

}



interface DataTableProps<T extends object> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  rowActionsHeader?: string;
  selection?: RowSelection<T>;
  getRowKey?: (row: T, index: number) => string;
  expandedRowKeys?: string[];
  renderExpandedRow?: (row: T) => ReactNode | null;
}



export function DataTable<T extends object>({
  columns,
  rows,
  onRowClick,
  rowActions,
  rowActionsHeader = "Thao tác",
  selection,
  getRowKey,
  expandedRowKeys = [],
  renderExpandedRow,
}: DataTableProps<T>) {

  const visibleIds = useMemo(

    () => (selection ? rows.map((row) => selection.getRowId(row)) : []),

    [rows, selection],

  );



  const allVisibleSelected =

    selection && visibleIds.length > 0 && visibleIds.every((id) => selection.selectedIds.has(id));

  const someVisibleSelected =

    selection && visibleIds.some((id) => selection.selectedIds.has(id)) && !allVisibleSelected;



  const toggleRow = (rowId: string, checked: boolean) => {

    if (!selection) return;

    const next = new Set(selection.selectedIds);

    if (checked) next.add(rowId);

    else next.delete(rowId);

    selection.onSelectedIdsChange(next);

  };



  const toggleAllVisible = (checked: boolean) => {

    if (!selection) return;

    const next = new Set(selection.selectedIds);

    if (checked) visibleIds.forEach((id) => next.add(id));

    else visibleIds.forEach((id) => next.delete(id));

    selection.onSelectedIdsChange(next);

  };



  return (

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full border-separate border-spacing-0 text-sm">

          <thead className="bg-slate-50 text-left text-slate-500">

            <tr>

              {selection ? (

                <th className="w-10 whitespace-nowrap px-3 py-3 font-medium">

                  <label className="inline-flex cursor-pointer items-center gap-2">

                    <input

                      type="checkbox"

                      checked={allVisibleSelected}

                      ref={(el) => {

                        if (el) el.indeterminate = Boolean(someVisibleSelected);

                      }}

                      onChange={(e) => toggleAllVisible(e.target.checked)}

                      aria-label="Chọn tất cả"

                    />

                    <span className="sr-only">Chọn tất cả</span>

                  </label>

                </th>

              ) : null}

              {columns.map((column) => (

                <th key={String(column.key)} className="whitespace-nowrap px-4 py-3 font-medium">

                  {column.header}

                </th>

              ))}

              {rowActions ? <th className="whitespace-nowrap px-4 py-3 font-medium">{rowActionsHeader}</th> : null}

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-200">

            {rows.map((row, rowIndex) => {
              const selectionRowId = selection?.getRowId(row);
              const rowId = selectionRowId ?? getRowKey?.(row, rowIndex) ?? String(rowIndex);
              const isSelected = selectionRowId ? Boolean(selection?.selectedIds.has(selectionRowId)) : false;
              const expandedContent = expandedRowKeys.includes(rowId) ? renderExpandedRow?.(row) : null;
              const colSpan =
                columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

              return (
                <Fragment key={rowId}>
                  <tr
                    key={rowId}
                    className={`cursor-pointer align-top transition-colors hover:bg-slate-50 ${isSelected ? "bg-cyan-50/60" : ""}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selection && selectionRowId ? (
                      <td
                        className="whitespace-nowrap px-3 py-3 align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleRow(selectionRowId, e.target.checked)}
                          aria-label={`Chọn ${selectionRowId}`}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="whitespace-nowrap px-4 py-3 align-top text-slate-700">
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? "")}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="whitespace-nowrap px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    ) : null}
                  </tr>
                  {expandedContent ? (
                    <tr key={`${rowId}-expanded`} className="bg-slate-50/70">
                      <td colSpan={colSpan}>{expandedContent}</td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>

  );

}

