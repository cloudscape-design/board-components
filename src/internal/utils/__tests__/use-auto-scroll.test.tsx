// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";

import { useAutoScroll } from "../use-auto-scroll";
import { useLastInteraction } from "../use-last-interaction";

vi.mock("../use-last-interaction", () => ({ useLastInteraction: vi.fn() }));

const mockedUseLastInteraction = vi.mocked(useLastInteraction);

describe("useAutoScroll", () => {
  let mockGetLastInteraction: MockedFunction<() => "pointer" | "keyboard">;
  let mockScrollIntoView: MockedFunction<(options?: ScrollIntoViewOptions) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockGetLastInteraction = vi.fn().mockReturnValue("pointer");
    mockedUseLastInteraction.mockReturnValue(mockGetLastInteraction);

    vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    vi.spyOn(global, "setTimeout");
    vi.spyOn(global, "clearTimeout");

    mockScrollIntoView = vi.fn();

    // Mock window dimensions
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 600,
    });

    Object.defineProperty(document, "activeElement", {
      writable: true,
      configurable: true,
      value: {
        scrollIntoView: mockScrollIntoView,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should set up event listeners on init and return cleanup function", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    const cleanup = controller.init();

    expect(window.addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function));

    cleanup();

    expect(clearTimeout).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function));
  });

  it("should start auto-scrolling when run() is called and pointer is in bottom margin", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    // Simulate pointer move to bottom margin (clientY > innerHeight - 50)
    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    pointerMoveHandler?.({ clientY: 560 } as PointerEvent); // 560 > 550 (600 - 50)

    // Fast-forward timer to trigger scroll
    vi.advanceTimersByTime(10);

    expect(window.scrollBy).toHaveBeenCalledWith({ top: 5 }); // direction=1, increment=5
  });

  it("should start auto-scrolling upward when pointer is in top margin", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    // Simulate pointer move to top margin (clientY < 50)
    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    pointerMoveHandler?.({ clientY: 30 } as PointerEvent); // 30 < 50

    // Fast-forward timer to trigger scroll
    vi.advanceTimersByTime(10);

    expect(window.scrollBy).toHaveBeenCalledWith({ top: -5 }); // direction=-1, increment=5
  });

  it("should stop auto-scrolling when pointer is in middle area", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    // First, move to bottom margin to start scrolling
    pointerMoveHandler?.({ clientY: 560 } as PointerEvent);
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 5 });

    // Then move to middle area
    vi.mocked(window.scrollBy).mockClear();
    pointerMoveHandler?.({ clientY: 300 } as PointerEvent); // Middle of screen

    // Fast-forward timer - should not scroll anymore
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("should stop auto-scrolling when stop() is called", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    // Move to bottom margin
    pointerMoveHandler?.({ clientY: 560 } as PointerEvent);

    // Stop the controller
    controller.stop();

    // Fast-forward timer - should not scroll
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("should reset scroll direction on pointer up", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;
    const pointerUpHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointerup")?.[1] as (() => void) | undefined;

    // Move to bottom margin to start scrolling
    pointerMoveHandler?.({ clientY: 560 } as PointerEvent);
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 5 });

    // Trigger pointer up
    vi.mocked(window.scrollBy).mockClear();
    pointerUpHandler?.();

    // Fast-forward timer - should not scroll anymore
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("should not respond to pointer events when not active", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    // Don't call run() - controller is not active

    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    // Move to bottom margin
    pointerMoveHandler?.({ clientY: 560 } as PointerEvent);

    // Fast-forward timer - should not scroll
    vi.advanceTimersByTime(10);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("should schedule active element scroll into view for keyboard interactions", () => {
    mockGetLastInteraction.mockReturnValue("keyboard");

    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    const activeElement = { scrollIntoView: mockScrollIntoView };
    Object.defineProperty(document, "activeElement", {
      value: activeElement,
      configurable: true,
    });

    controller.scheduleActiveElementScrollIntoView(100);

    // Fast-forward to after the delay
    vi.advanceTimersByTime(100);

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
    });
  });

  it("should not scroll active element into view for pointer interactions", () => {
    mockGetLastInteraction.mockReturnValue("pointer");

    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    const activeElement = { scrollIntoView: mockScrollIntoView };
    Object.defineProperty(document, "activeElement", {
      value: activeElement,
      configurable: true,
    });

    controller.scheduleActiveElementScrollIntoView(100);

    // Fast-forward to after the delay
    vi.advanceTimersByTime(100);

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it("should not scroll into view if active element changes during delay", () => {
    mockGetLastInteraction.mockReturnValue("keyboard");

    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    const originalActiveElement = { scrollIntoView: mockScrollIntoView };
    Object.defineProperty(document, "activeElement", {
      value: originalActiveElement,
      configurable: true,
    });

    controller.scheduleActiveElementScrollIntoView(100);

    // Change active element before delay completes
    const newActiveElement = { scrollIntoView: vi.fn() };
    Object.defineProperty(document, "activeElement", {
      value: newActiveElement,
      configurable: true,
    });

    // Fast-forward to after the delay
    vi.advanceTimersByTime(100);

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it("should not scroll into view if no active element", () => {
    mockGetLastInteraction.mockReturnValue("keyboard");

    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    Object.defineProperty(document, "activeElement", {
      value: null,
      configurable: true,
    });

    controller.scheduleActiveElementScrollIntoView(100);

    // Fast-forward to after the delay
    vi.advanceTimersByTime(100);

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it("should clear previous timeout when scheduling new active element scroll", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    // Schedule first scroll
    controller.scheduleActiveElementScrollIntoView(100);
    const firstTimeoutId = vi.mocked(setTimeout).mock.results[vi.mocked(setTimeout).mock.results.length - 1]?.value;

    // Schedule second scroll before first completes
    controller.scheduleActiveElementScrollIntoView(200);

    expect(clearTimeout).toHaveBeenCalledWith(firstTimeoutId);
  });

  it("should continue scrolling repeatedly while active and in margin", () => {
    const { result } = renderHook(() => useAutoScroll());
    const controller = result.current;

    controller.init();
    controller.run();

    const pointerMoveHandler = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "pointermove")?.[1] as ((event: PointerEvent) => void) | undefined;

    // Move to bottom margin
    pointerMoveHandler?.({ clientY: 560 } as PointerEvent);

    // Advance timer once to get the first scroll call
    vi.advanceTimersByTime(10);

    // Verify it's scrolling with the correct parameters
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 5 });
    const initialCallCount = vi.mocked(window.scrollBy).mock.calls.length;

    // Advance timer again to verify it continues scrolling
    vi.advanceTimersByTime(10);
    expect(vi.mocked(window.scrollBy).mock.calls.length).toBeGreaterThan(initialCallCount);

    // Advance timer once more to verify it's still scrolling
    vi.advanceTimersByTime(10);
    expect(vi.mocked(window.scrollBy).mock.calls.length).toBeGreaterThan(initialCallCount + 1);

    // All calls should be the same
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 5 });
  });
});
