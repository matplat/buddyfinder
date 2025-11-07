import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/db/supabase.server';
import { createErrorResponse, ApiErrorCode } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

export const prerender = false;

const logger = createLogger('API:auth/logout');

/**
 * POST /api/auth/logout
 * Wylogowanie użytkownika
 */
export const POST: APIRoute = async ({ cookies }) => {
  logger.info('POST /api/auth/logout');

  try {
    const supabase = createServerSupabaseClient(cookies);

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout failed', { error: error.message });
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Wystąpił błąd podczas wylogowywania'
      );
    }

    logger.info('Logout successful');
    return new Response(
      JSON.stringify({ message: 'Wylogowano pomyślnie' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Unexpected error during logout', { error });
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Wystąpił nieoczekiwany błąd'
    );
  }
};
