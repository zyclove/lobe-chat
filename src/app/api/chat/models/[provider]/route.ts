import { NextResponse } from 'next/server';

import { getPreferredRegion } from '@/app/api/config';
import { createErrorResponse } from '@/app/api/errorResponse';
import { ChatCompletionErrorPayload, ModelProvider } from '@/libs/agent-runtime';
import { ChatErrorType } from '@/types/fetch';

import AgentRuntime from '../../agentRuntime';
import { checkAuth } from '../../auth';

export const runtime = 'edge';

export const preferredRegion = getPreferredRegion();

export const GET = checkAuth(async (req, { params, jwtPayload }) => {
  const { provider } = params;

  try {
    const openRouterKey = jwtPayload.apiKey || 'openrouter-dont-need-api-key-for-model-list';

    const agentRuntime = await AgentRuntime.initializeWithUserPayload(provider, {
      ...jwtPayload,
      apiKey: provider === ModelProvider.OpenRouter ? openRouterKey : jwtPayload.apiKey,
    });

    const list = await agentRuntime.models();

    return NextResponse.json(list);
  } catch (e) {
    const {
      errorType = ChatErrorType.InternalServerError,
      error: errorContent,
      ...res
    } = e as ChatCompletionErrorPayload;

    const error = errorContent || e;
    // track the error at server side
    console.error(`Route: [${provider}] ${errorType}:`, error);

    return createErrorResponse(errorType, { error, ...res, provider });
  }
});