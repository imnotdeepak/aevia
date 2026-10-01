export type TaskData = { id: string; title: string; date: string; done: boolean };

export const BOARD_COLUMNS = [
  { id: 'todo', title: 'To do', color: '#c25b5b' },
  { id: 'doing', title: 'In progress', color: '#c9a63c' },
  { id: 'done', title: 'Done', color: '#4f9d6a' },
] as const;

export type BoardStatus = (typeof BOARD_COLUMNS)[number]['id'];

export const isBoardStatus = (value: string): value is BoardStatus => BOARD_COLUMNS.some((column) => column.id === value);

export type BoardCardData = { id: string; title: string; notes: string; status: BoardStatus };
