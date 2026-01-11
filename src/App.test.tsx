import { render } from "@testing-library/react";
import App from "./App";

jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
}));

test("renders App without crashing", () => {
  render(<App />);
});
