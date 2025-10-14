from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


class ResilientRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Simple HTTP handler that swallows broken-pipe errors for smoother dev serving."""

    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except BrokenPipeError:
            # Browser closed the connection before we finished sending the response.
            pass

    def log_error(self, format: str, *args):
        if args and isinstance(args[0], BrokenPipeError):
            return
        super().log_error(format, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local static file server with graceful error handling.")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument("--directory", default=Path(__file__).parent, help="Directory to serve (default: this folder)")
    args = parser.parse_args()

    handler = lambda *handler_args, **handler_kwargs: ResilientRequestHandler(  # noqa: E731
        *handler_args, directory=str(args.directory), **handler_kwargs
    )

    with socketserver.ThreadingTCPServer((args.host, args.port), handler) as httpd:
        httpd.allow_reuse_address = True
        serve_from = Path(args.directory).resolve()
        print(f"Serving {serve_from} at http://{args.host}:{args.port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down…")


if __name__ == "__main__":
    main()
