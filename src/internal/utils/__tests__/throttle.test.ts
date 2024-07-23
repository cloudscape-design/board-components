// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeEach, describe, expect, Mock, SpyInstance, test, vi } from "vitest";

import { throttle } from "../throttle";

describe("throttle", () => {
  let dateNowSpy: SpyInstance<[], number>;
  let requestAnimationFrameSpy: SpyInstance<[FrameRequestCallback], number>;
  let funcMock: Mock;
  let tick: () => void;

  beforeEach(() => {
    let time = 0;
    dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => time);
    requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      tick = () => {
        time++;
        callback(time);
      };
      return time;
    });
    funcMock = vi.fn();
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
  });

  test("should run the client function synchronously for the first invocation", () => {
    const throttled = throttle(funcMock, 50);

    throttled("arg1", "arg2");

    expect(funcMock).toBeCalledTimes(1);
    expect(funcMock).toBeCalledWith("arg1", "arg2");
    expect(dateNowSpy).toBeCalledTimes(1);
    expect(requestAnimationFrameSpy).toBeCalledTimes(0);
  });

  test("should run the client function three times only", () => {
    const throttled = throttle(funcMock, 25);

    // Execution 1
    throttled(`arg-${0}`);

    // The function should execute every 25th iteration.
    for (let i = 1; i <= 50; i++) {
      throttled(`arg-${i}`);
      tick();
    }

    expect(funcMock).toBeCalledTimes(3);
    expect(funcMock).toBeCalledWith("arg-0");
    expect(funcMock).toBeCalledWith("arg-25");
    expect(funcMock).toBeCalledWith("arg-50");
  });

  test("should cancel the function after first invocation", () => {
    const throttled = throttle(funcMock, 25);

    // This should do nothing - cancellation is not persistent.
    throttled.cancel();

    // Execution 1
    throttled(`arg-${0}`);

    // The function should execute every 25th iteration.
    for (let i = 1; i <= 50; i++) {
      throttled(`arg-${i}`);
      tick();

      if (i === 40) {
        throttled.cancel();
        break;
      }
    }

    expect(funcMock).toBeCalledTimes(1);
    expect(funcMock).toBeCalledWith("arg-0");
  });
});
