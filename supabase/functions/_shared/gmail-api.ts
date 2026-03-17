export async function ensureLabelExists(accessToken: string, labelName: string): Promise<string> {
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const listData = await listRes.json();
  const existing = listData.labels?.find((l: any) => l.name === labelName);
  
  if (existing) return existing.id;

  const createRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    })
  });
  const newData = await createRes.json();
  return newData.id;
}

export async function applyLabelToMessage(accessToken: string, messageId: string, labelId: string): Promise<void> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addLabelIds: [labelId]
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[Gmail API] Failed to apply label: ${err}`);
  }
}
