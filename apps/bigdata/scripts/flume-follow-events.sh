#!/usr/bin/env bash
set -eu

EVENT_FILE="${1:-/opt/skillbridge/data/events/events.log}"
mkdir -p "$(dirname "$EVENT_FILE")"
touch "$EVENT_FILE"

exec perl -MIO::Handle -e '
  my $file = shift @ARGV;
  open(my $fh, "<", $file) or die "Cannot open $file: $!";
  seek($fh, 0, 2);
  STDOUT->autoflush(1);

  while (1) {
    while (my $line = <$fh>) {
      print $line;
    }

    my $pos = tell($fh);
    my $size = -s $file;
    if (defined $size && defined $pos && $size < $pos) {
      close($fh);
      open($fh, "<", $file) or die "Cannot reopen $file: $!";
      seek($fh, 0, 2);
    } elsif (defined $pos) {
      seek($fh, $pos, 0);
    }

    sleep 1;
  }
' "$EVENT_FILE"
