import { act, renderHook, waitFor } from "@testing-library/react";

import { useAuthStore } from "@/stores/authStore";

const mockFetch = global.fetch as jest.Mock;

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      _mounted: false,
    });
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("logs in successfully and stores the access token", async () => {
    const mockUser = {
      id: 1,
      phone: "9876543210",
      name: "Test Farmer",
      email: "test@example.com",
      role: "farmer" as const,
      language: "hi-IN",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        access_token: "token-123",
        user: mockUser,
      }),
    });

    const { result } = renderHook(() => useAuthStore());

    let success = false;
    await act(async () => {
      success = await result.current.login("9876543210", "password123");
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    expect(success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith("access_token", "token-123");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns a readable error when login fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ detail: "Invalid credentials" }),
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("wrong-user", "wrong-password");
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe("Invalid credentials");
    });
  });

  it("registers successfully and sets the authenticated user", async () => {
    const mockUser = {
      id: 2,
      phone: "9876543210",
      name: "New Farmer",
      email: "new@example.com",
      role: "farmer" as const,
      language: "hi-IN",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        access_token: "register-token",
        user: mockUser,
      }),
    });

    const { result } = renderHook(() => useAuthStore());

    let success = false;
    await act(async () => {
      success = await result.current.register({
        phone: "9876543210",
        name: "New Farmer",
        password: "password123",
        email: "new@example.com",
        language: "hi-IN",
        role: "farmer",
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe("New Farmer");
    });

    expect(success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith("access_token", "register-token");
  });

  it("clears session state when profile validation fails", async () => {
    localStorage.getItem = jest.fn().mockReturnValue("stale-token");
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn(),
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
    expect(result.current.error).toBe("Session expired");
  });
});
