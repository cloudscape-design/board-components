// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type Listeners<L> = {
  [E in keyof L]: (...args: any[]) => any;
};

export class EventEmitter<Events extends Listeners<Events>> {
  private listeners = new Map<keyof Events, Array<Events[keyof Events]>>();

  public on<Event extends keyof Events>(event: Event, handler: Events[Event]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);

    return () => {
      this.listeners.set(
        event,
        this.listeners.get(event)!.filter((item) => item !== handler),
      );
    };
  }

  protected emit<Event extends keyof Events>(event: Event, ...data: Parameters<Events[Event]>) {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(...data);
    }
  }
}
