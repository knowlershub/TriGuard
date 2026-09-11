import {
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import {
  buildWishlistReminder,
} from "@/lib/wishlistReminder";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const session =
      await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const result =
      await buildWishlistReminder(
        userId
      );

    return NextResponse.json({
      shouldRemind:
        result.shouldRemind,
      wishlist: {
        id:
          result.wishlistId,
        title:
          result.title,
        remainingAmount:
          result.remainingAmount,
        currency:
          result.currency,
      },
      discretionarySpend:
        result.discretionarySpend,
      message:
        result.message,
    });
  } catch (error) {
    console.error(
      "[wishlist reminder] GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to build wishlist reminder.",
      },
      {
        status: 500,
      }
    );
  }
}
