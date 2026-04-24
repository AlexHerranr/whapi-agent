export class AgentError extends Error {
  public readonly code: string;
  public override readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.cause = cause;
  }
}

export class ConfigError extends AgentError {
  constructor(message: string, cause?: unknown) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigError";
  }
}

export class ProviderError extends AgentError {
  constructor(message: string, cause?: unknown) {
    super(message, "PROVIDER_ERROR", cause);
    this.name = "ProviderError";
  }
}

export class ToolExecutionError extends AgentError {
  constructor(
    public readonly toolName: string,
    message: string,
    cause?: unknown,
  ) {
    super(`[${toolName}] ${message}`, "TOOL_EXECUTION_ERROR", cause);
    this.name = "ToolExecutionError";
  }
}

export class StateError extends AgentError {
  constructor(message: string, cause?: unknown) {
    super(message, "STATE_ERROR", cause);
    this.name = "StateError";
  }
}

export class WhapiError extends AgentError {
  constructor(
    message: string,
    public readonly status?: number,
    cause?: unknown,
  ) {
    super(message, "WHAPI_ERROR", cause);
    this.name = "WhapiError";
  }
}
