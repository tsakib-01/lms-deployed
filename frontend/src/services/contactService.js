const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/contact`;

export const submitContactForm = async (formData) => {
  const response = await fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
};

export const getMessages = async () => {
  const response = await fetch(`${API_URL}/messages`);
  return response.json();
};

export const updateMessageStatus = async (id, status) => {
  const response = await fetch(`${API_URL}/messages/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};

export const deleteMessage = async (id) => {
  const response = await fetch(`${API_URL}/messages/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};