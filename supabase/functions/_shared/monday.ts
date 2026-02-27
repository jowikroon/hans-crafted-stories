/**
 * Monday.com GraphQL API v2 helper.
 * Requires MONDAY_API_TOKEN env var.
 */

const MONDAY_API_URL = "https://api.monday.com/v2";

function getToken(): string {
  const token = Deno.env.get("MONDAY_API_TOKEN");
  if (!token) throw new Error("MONDAY_API_TOKEN not configured");
  return token;
}

async function mondayQuery(query: string, variables?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Monday API ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.errors?.length) {
    throw new Error(`Monday API error: ${data.errors[0].message}`);
  }
  return data.data;
}

export interface MondayItemDetails {
  id: string;
  name: string;
  columnValues: Array<{ id: string; title: string; text: string | null; value: string | null }>;
  boardId: string;
  groupId: string;
}

export async function getItemDetails(itemId: string): Promise<MondayItemDetails | null> {
  const data = await mondayQuery(
    `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        name
        board { id }
        group { id }
        column_values {
          id
          title
          text
          value
        }
      }
    }`,
    { ids: [itemId] },
  ) as { items: Array<{ id: string; name: string; board: { id: string }; group: { id: string }; column_values: Array<{ id: string; title: string; text: string | null; value: string | null }> }> };

  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    name: item.name,
    columnValues: item.column_values,
    boardId: item.board.id,
    groupId: item.group.id,
  };
}

export async function addItemUpdate(itemId: string, message: string): Promise<void> {
  await mondayQuery(
    `mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) {
        id
      }
    }`,
    { itemId, body: message },
  );
}

export async function updateItemStatus(
  boardId: string,
  itemId: string,
  columnId: string,
  label: string,
): Promise<void> {
  await mondayQuery(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }`,
    { boardId, itemId, columnId, value: JSON.stringify({ label }) },
  );
}

export async function updateItemColumn(
  boardId: string,
  itemId: string,
  columnId: string,
  value: string,
): Promise<void> {
  await mondayQuery(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }`,
    { boardId, itemId, columnId, value },
  );
}
