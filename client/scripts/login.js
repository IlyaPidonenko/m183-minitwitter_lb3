document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorText = document.getElementById("error");

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const htmlTagPattern = /<[^>]+>/;
    const errors = [];

    if (htmlTagPattern.test(username)) {
      errors.push("HTML tags are not allowed in the username.");
    }
    if (!password) {
      errors.push("Password is required.");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters.");
    }

    if (errors.length > 0) {
      // Zeige alle Fehlermeldungen dem Benutzer an
      errorText.innerHTML = errors.join("<br>");
      // Gib die Fehlermeldungen und den HTTP-Response-Statuscode in der Konsole aus
      console.error("Fehler bei der Anmeldung:", errors);
    } else {
      // Führe die Anmeldung aus
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data?.username) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "/";
      } else {
        // Zeige eine allgemeine Fehlermeldung an
        errorText.innerText = "Invalid username or password. Please try again.";
        console.error(
          "Anmeldung fehlgeschlagen: Ungültiger Benutzername oder Passwort. Statuscode:",
          response.status
        );
      }
    }
  });
});
