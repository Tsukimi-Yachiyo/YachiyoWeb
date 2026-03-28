export function getMailList() {
  return fetch("/api/v2/mail/list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({})
  }).then(res => res.json());
}

export function sendMail(data) {
  return fetch("/api/v2/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

export function readMail(id) {
  return fetch("/api/v2/mail/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(id)
  }).then(res => res.json());
}
