import { Button, Card, CardBody } from "@heroui/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardBody className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-default-900 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-default-700 mb-4">
              User Not Found
            </h2>
            <p className="text-default-500 mb-6">
              The user you're looking for doesn't exist or may have changed
              their username.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button as={Link} href="/" color="primary">
              Go Home
            </Button>
            <Button as={Link} href="/users" variant="bordered">
              Browse Users
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
