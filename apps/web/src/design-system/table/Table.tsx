import React, { useEffect } from 'react';
import { TableProps, Table as MantineTable, Pagination } from '@mantine/core';
import styled from '@emotion/styled';
import {
  useTable,
  Column,
  usePagination,
  TableInstance,
  UsePaginationInstanceProps,
  UsePaginationState,
  Row,
  CellProps,
} from 'react-table';

import useStyles from './Table.styles';
import { colors } from '../config';
import { DefaultCell } from './DefaultCell';

const NoDataPlaceholder = styled.div`
  padding: 0 30px;
  flex: 1;
`;

export type IExtendedCellProps<T extends object = {}> = CellProps<T> & { isLoading: boolean };

export type IExtendedColumn<T extends object = {}> = Column<T> & {
  Cell?: (props: IExtendedCellProps<T>) => React.ReactNode;
};

const defaultColumn: Partial<IExtendedColumn> = {
  Cell: DefaultCell,
};

export interface ITableProps<T extends object> {
  columns?: IExtendedColumn<T>[];
  data?: T[];
  loading?: boolean;
  pagination?: any;
  onRowClick?: (row: Row<T>) => void;
  noDataPlaceholder?: React.ReactNode;
  loadingItems?: number;
}

type UseTableProps<T extends object> = UsePaginationInstanceProps<T> &
  TableInstance<T> & {
    state: UsePaginationState<T>;
  };

/**
 * Table component
 *
 */
export function Table<T extends object>({
  columns: userColumns,
  data: userData,
  pagination = false,
  loading = false,
  onRowClick,
  noDataPlaceholder,
  loadingItems = 10,
  ...props
}: ITableProps<T>) {
  const { pageSize, total, onPageChange, current } = pagination;
  const columns = React.useMemo(() => userColumns?.map((col) => ({ ...col })), [userColumns]);
  const data = React.useMemo(() => (userData || [])?.map((row) => ({ ...row })), [userData]);
  const fakeData = React.useMemo(() => Array.from({ length: loadingItems }).map((_, index) => ({ index })), []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows: allRows,
    prepareRow,
    page,
    gotoPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      defaultColumn,
      data: loading ? fakeData : data,
      ...(pagination
        ? {
            initialState: { pageIndex: current, pageSize },
            manualPagination: true,
            pageCount: Math.ceil(total / pageSize),
          }
        : {}),
    } as any,
    usePagination
  ) as unknown as UseTableProps<T>;

  useEffect(() => {
    if (onPageChange) {
      onPageChange(pageIndex);
    }
  }, [pageIndex]);

  const handlePageChange = (pageNumber) => {
    gotoPage(pageNumber - 1);
  };
  const getPageCount = () => {
    return Math.ceil(total / pageSize);
  };

  const { classes } = useStyles();
  const defaultDesign = { verticalSpacing: 'sm', horizontalSpacing: 'sm', highlightOnHover: true } as TableProps;
  const rows = pagination ? page : allRows;
  const noData = rows.length === 0;

  return (
    <div style={{ position: 'relative', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
      <MantineTable className={classes.root} {...defaultDesign} {...getTableProps()} {...props}>
        <thead>
          {headerGroups.map((headerGroup, i) => {
            return (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);

            return (
              <tr
                onClick={() => (!loading && onRowClick ? onRowClick(row) : null)}
                {...row.getRowProps()}
                className={classes.tableRow}
                data-disabled={loading}
              >
                {row.cells.map((cell, i) => (
                  <td
                    {...cell.getCellProps({
                      style: {
                        maxWidth: cell.column.maxWidth,
                        width: cell.column.width,
                      },
                    })}
                  >
                    {cell.render('Cell', { isLoading: loading })}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </MantineTable>
      {!loading && noData && noDataPlaceholder && <NoDataPlaceholder>{noDataPlaceholder}</NoDataPlaceholder>}
      {!loading && pagination && total > 0 && pageSize > 1 && getPageCount() > 1 && (
        <div style={{ marginTop: 'auto' }}>
          <Pagination
            styles={{
              item: {
                marginTop: '15px',
                marginBottom: '15px',
                backgroundColor: 'transparent',
                '&[data-active]': {
                  backgroundImage: colors.horizontal,
                  border: 'none',
                },
              },
            }}
            total={getPageCount()}
            page={pageIndex + 1}
            onChange={handlePageChange}
            position="center"
          />
        </div>
      )}
    </div>
  );
}
