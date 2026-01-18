import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  mock,
  test,
} from "bun:test";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";

class MockServiceA {}

class MockServiceB {}

class MockServiceC {}

describe("Dependency Injection Container", () => {
  let mockServices = {} as Record<string, unknown>;

  beforeEach(() => {
    mockServices["MockServiceA"] = new MockServiceA();
    mockServices["MockServiceB"] = new MockServiceB();
    mockServices["MockServiceC"] = new MockServiceC();
  });

  test("should register a static instance", () => {
    const instance = DependencyInjectionContainer.instance;
    const anotherInstance = DependencyInjectionContainer.instance;

    expect(instance).toEqual(anotherInstance);
  });

  test("should have empty services hashmap on creation", () => {
    const instance = DependencyInjectionContainer.instance;
    expect(instance.getTotalServices()).toEqual(0);
  });

  test("should add single dependency properly", () => {
    const key = "MockServiceA";
    const mockService = mockServices[key];
    const instance = DependencyInjectionContainer.instance;

    instance.add(key, mockService);

    expect(instance.getTotalServices()).toEqual(1);
    expect(instance.getService(key)).toBeInstanceOf(MockServiceA);
  });

  test("should throw error if dependency key is not found", () => {
    const key = "MockFakeService";
    const instance = DependencyInjectionContainer.instance;

    expect(() => instance.getService(key)).toThrowError(
      `Service with name ${key} not found`,
    );
  });

  test("should add many services based on many tokens", () => {
    const keys = Object.keys(mockServices) as string[];
    const instance = DependencyInjectionContainer.instance;

    instance.addMany(keys, mockServices);

    expect(instance.getTotalServices()).toEqual(3);
    expect(instance.getService("MockServiceA")).toBeInstanceOf(MockServiceA);
    expect(instance.getService("MockServiceB")).toBeInstanceOf(MockServiceB);
    expect(instance.getService("MockServiceC")).toBeInstanceOf(MockServiceC);
  });
});
