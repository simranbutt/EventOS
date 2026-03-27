export const makeTicketId = () => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString().slice(-6);
  return `EVT-${stamp}-${rand}`;
};

