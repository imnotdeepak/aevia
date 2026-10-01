'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

import { createCard, deleteCard, moveCard, updateCard } from '@/app/app/board-actions';
import { useBoard } from '@/components/app-data';
import { useUndo } from '@/components/undo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BOARD_COLUMNS, type BoardCardData, type BoardStatus } from '@/lib/planner';

type DropTarget = { status: BoardStatus; beforeId: string | null };

const isSaving = (card: BoardCardData) => card.id.startsWith('tmp-');

export function BoardView() {
  const { items: cards, error, clearError, run } = useBoard();
  const notify = useUndo();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const [editing, setEditing] = useState<BoardCardData | null>(null);

  const move = (id: string, status: BoardStatus, beforeId: string | null) => {
    if (beforeId === id) return;
    run({ type: 'move', id, status, beforeId }, () => moveCard(id, status, beforeId));
  };

  const add = (status: BoardStatus, title: string) => {
    const value = title.trim();
    if (!value) return;
    run({ type: 'add', card: { id: `tmp-${crypto.randomUUID()}`, title: value, notes: '', status } }, () => createCard(value, status));
  };

  const endDrag = () => {
    setDragging(null);
    setOver(null);
  };

  const total = cards.length;
  const count = (status: BoardStatus) => cards.filter((card) => card.status === status).length;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Board</p>
          <h1 className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-2xl font-semibold tracking-[-0.03em]">
            {total === 0 ? (
              'Plan bigger work here'
            ) : (
              BOARD_COLUMNS.map((column) => (
                <span key={column.id} className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: column.color }} aria-hidden />
                  <span style={{ color: column.color }}>{count(column.id)}</span> {column.title.toLowerCase()}
                </span>
              ))
            )}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">Drag cards between columns, or use the arrows on each card.</p>
      </div>

      {error && (
        <p role="alert" className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          <button type="button" onClick={clearError} className="underline">Dismiss</button>
        </p>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        {BOARD_COLUMNS.map((column, columnIndex) => {
          const list = cards.filter((card) => card.status === column.id);
          const columnOver = over?.status === column.id;
          return (
            <section
              key={column.id}
              aria-label={column.title}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                // Over the column but not a card: drop at the end.
                if (event.target === event.currentTarget || !(event.target as HTMLElement).closest('[data-card]')) setOver({ status: column.id, beforeId: null });
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging && over) move(dragging, over.status, over.beforeId);
                endDrag();
              }}
              className="rounded-[1.75rem] border p-3 transition-colors"
              style={{
                background: `color-mix(in srgb, ${column.color} 4%, var(--card))`,
                borderColor: `color-mix(in srgb, ${column.color} ${columnOver ? 60 : 20}%, transparent)`,
              }}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[.14em]" style={{ color: column.color }}>
                  <span className="size-2.5 rounded-full" style={{ background: column.color }} aria-hidden />
                  {column.title}
                </h2>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `color-mix(in srgb, ${column.color} 14%, transparent)`, color: column.color }}>{list.length}</span>
              </div>

              <ul className="mt-1 grid min-h-16 gap-2">
                {list.map((card) => (
                  <li key={card.id} data-card>
                    {columnOver && dragging && over?.beforeId === card.id && <DropLine color={column.color} />}
                    <article
                      draggable={!isSaving(card)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', card.id);
                        setDragging(card.id);
                      }}
                      onDragEnd={endDrag}
                      onDragOver={(event) => {
                        if (!dragging) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const box = event.currentTarget.getBoundingClientRect();
                        const upperHalf = event.clientY < box.top + box.height / 2;
                        const index = list.findIndex((item) => item.id === card.id);
                        const next = upperHalf ? card.id : (list[index + 1]?.id ?? null);
                        setOver({ status: column.id, beforeId: next });
                      }}
                      className={`group rounded-2xl border border-x-4 bg-card transition-opacity ${dragging === card.id ? 'opacity-40' : ''} ${isSaving(card) ? '' : 'cursor-grab active:cursor-grabbing'}`}
                      style={{ borderColor: `color-mix(in srgb, ${column.color} 22%, transparent)`, borderLeftColor: column.color, borderRightColor: column.color }}
                    >
                      <button type="button" onClick={() => setEditing(card)} className="block w-full px-4 pb-2 pt-3 text-left">
                        <span className={`block break-words text-sm font-medium ${column.id === 'done' ? 'text-muted-foreground line-through' : ''}`}>{card.title}</span>
                        {card.notes && <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{card.notes}</span>}
                      </button>
                      <div className="flex justify-between px-2 pb-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                        <MoveButton label={`Move ${card.title} to ${BOARD_COLUMNS[columnIndex - 1]?.title}`} disabled={columnIndex === 0 || isSaving(card)} onClick={() => move(card.id, BOARD_COLUMNS[columnIndex - 1].id, null)}><ArrowLeft className="size-4" /></MoveButton>
                        <MoveButton label={`Move ${card.title} to ${BOARD_COLUMNS[columnIndex + 1]?.title}`} disabled={columnIndex === BOARD_COLUMNS.length - 1 || isSaving(card)} onClick={() => move(card.id, BOARD_COLUMNS[columnIndex + 1].id, null)}><ArrowRight className="size-4" /></MoveButton>
                      </div>
                    </article>
                  </li>
                ))}
                {columnOver && dragging && over?.beforeId === null && <li><DropLine color={column.color} /></li>}
                {list.length === 0 && !dragging && <li className="px-2 py-3 text-center text-xs text-muted-foreground">Nothing here yet</li>}
              </ul>

              <AddCard onAdd={(title) => add(column.id, title)} />
            </section>
          );
        })}
      </div>

      {editing && (
        <CardDialog
          key={editing.id}
          card={editing}
          onClose={() => setEditing(null)}
          onSave={(title, notes) => run({ type: 'edit', id: editing.id, title, notes }, () => updateCard(editing.id, { title, notes }))}
          onDelete={() => {
            const card = editing;
            run({ type: 'delete', id: card.id }, () => deleteCard(card.id));
            notify(`Deleted "${card.title}"`, () => run({ type: 'add', card: { ...card, id: `tmp-${crypto.randomUUID()}` } }, () => createCard(card.title, card.status, card.notes)));
          }}
        />
      )}
    </div>
  );
}

function DropLine({ color }: { color: string }) {
  return <div className="my-1 h-1 rounded-full" style={{ background: color }} aria-hidden />;
}

function MoveButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-0">
      {children}
    </button>
  );
}

function AddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="mt-2 flex h-11 items-center gap-2 rounded-2xl border border-dashed border-border px-3 text-sm focus-within:border-[var(--accent)]"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(value);
        setValue('');
      }}
    >
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <input value={value} onChange={(event) => setValue(event.target.value)} maxLength={120} placeholder="Add a card" aria-label="Add a card" className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground" />
    </form>
  );
}

function CardDialog({ card, onClose, onSave, onDelete }: { card: BoardCardData; onClose: () => void; onSave: (title: string, notes: string) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(card.title);
  const [notes, setNotes] = useState(card.notes);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = title.trim().length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onSave(title, notes);
            onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
            <DialogDescription>In {BOARD_COLUMNS.find((column) => column.id === card.status)?.title}.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            Title
            <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Notes <span className="-mt-1 text-xs font-normal text-muted-foreground">Optional</span>
            <textarea value={notes} maxLength={2000} rows={4} onChange={(event) => setNotes(event.target.value)} className="resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-base outline-none focus:border-[var(--accent)]" />
          </label>
          <div className="flex items-center justify-between gap-3">
            {confirmDelete ? (
              <Button type="button" variant="destructive" onClick={() => { onDelete(); onClose(); }}>Delete forever</Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 />Delete</Button>
            )}
            <Button type="submit" disabled={!valid} className="h-10 bg-[var(--accent)] px-5 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
