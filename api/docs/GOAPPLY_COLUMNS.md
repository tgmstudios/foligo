# GoApply columns

Run `pnpm --filter foligo-api db:migrate:deploy` and regenerate the Prisma client with `pnpm --filter foligo-api db:generate` before starting the updated API. The migration adds nullable `users.goapplyColumns`; existing users retain the nine default columns until their first column change.

All endpoints require authentication and operate on the current user's columns:

| Method | Endpoint | Body / result |
| --- | --- | --- |
| GET | `/api/goapply/columns` | Returns ordered `{ status, label, color }` columns |
| POST | `/api/goapply/columns` | `{ label, color }`; returns the created column (201) |
| PUT | `/api/goapply/columns/:status` | `{ label, color }`; returns the updated column |
| DELETE | `/api/goapply/columns/:status` | `{ moveTo }`; moves jobs to that column and deletes the source |

Names must be unique within the board (case insensitive), trimmed, and 1–60 characters long. Colors are `bg-gray-500`, `bg-blue-500`, `bg-indigo-500`, `bg-purple-500`, `bg-yellow-500`, `bg-green-500`, `bg-red-500`, `bg-orange-500`, or `bg-gray-700`.

Column status identifiers remain stable when names or colors change. New columns use UUID identifiers. Job creation, updates, reordering, and the Kanban endpoint recognize the user's configured columns. Jobs created without a status enter the first column. Deletion requires another column as the destination; the final column cannot be deleted. Column changes and job migration run in one transaction, with column changes serialized per user.

The Kanban toolbar has an **Add Column** button. Each column's **Edit** button opens the name/color editor and deletion controls. Job form options, list filters, and status badges use the same persisted columns.
