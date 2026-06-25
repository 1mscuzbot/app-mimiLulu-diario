export function getTheme(user) {
  const isLucas = user === "Lucas";
  return {
    bg: "#FFFFFF",
    primary: isLucas ? "#4A90D9" : "#E91E63",
    primaryLight: isLucas ? "#BBDEFB" : "#FCE4EC",
    primaryDark: isLucas ? "#1565C0" : "#C2185B",
  };
}
