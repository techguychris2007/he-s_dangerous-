import type { TypedQuestion } from '../../types';

/** Networking fundamentals and modern networking lessons. */
export const NETWORKING_QUESTIONS: Record<string, TypedQuestion[]> = {
  'net-1': [
    { prompt: 'TCP and UDP work at which numbered OSI layer?', answer: '4', accept: ['layer 4', 'four'] },
    { prompt: 'Which Layer 2 protocol resolves IP addresses to MAC addresses on the local segment?', answer: 'ARP' },
  ],
  'net-2': [
    { prompt: 'What is the dotted subnet mask for a /24 prefix?', answer: '255.255.255.0' },
    { prompt: 'How many bits long is an IPv4 address?', answer: '32', accept: ['32 bits'] },
  ],
  'net-3': [
    { prompt: 'Client IP, client port, server IP, server port plus protocol is commonly called the what?', answer: 'five-tuple', accept: ['5-tuple', 'five tuple'] },
    { prompt: 'Which transport protocol sends independent datagrams with little coordination?', answer: 'UDP' },
  ],
  'net-4': [
    { prompt: 'A process bound only to which interface is reachable by local programs but not other machines?', answer: 'loopback' },
    { prompt: 'After a server binds a socket to an address and port, what does it do to wait for connections?', answer: 'listens', accept: ['listen'] },
  ],
  'net-5': [
    { prompt: 'Which DNS record type maps a hostname to an IPv6 address?', answer: 'AAAA' },
    { prompt: 'What is the DNS query type for a full zone transfer?', answer: 'AXFR' },
  ],
  'net-6': [
    { prompt: 'How many bits long is an IPv6 address?', answer: '128', accept: ['128 bits'] },
    { prompt: 'IPv6 groups are written in which number base?', answer: 'hexadecimal', accept: ['hex', 'base 16'] },
  ],
  'net-7': [
    { prompt: 'What creates a logical Layer 2 broadcast domain on compatible switches?', answer: 'VLAN', accept: ['a VLAN', 'vlans'] },
    { prompt: 'The set of devices that receive a particular Ethernet broadcast is called a what?', answer: 'broadcast domain' },
  ],
  'net-8': [
    { prompt: 'Which abbreviation names the routing information base of candidate routes?', answer: 'RIB' },
    { prompt: 'Which table of installed forwarding entries is consulted when a packet arrives?', answer: 'FIB', accept: ['forwarding information base'] },
  ],
  'net-modern-2': [
    { prompt: 'Which tool queries DNS directly using its selected server, unlike getent?', answer: 'dig' },
    { prompt: 'What three-letter term names how long a resolver may cache an answer?', answer: 'TTL' },
  ],
  'net-modern-3': [
    { prompt: 'HTTP/3 maps HTTP semantics onto which protocol instead of TCP?', answer: 'QUIC' },
    { prompt: 'QUIC itself runs over which transport protocol?', answer: 'UDP' },
  ],
  'net-modern-4': [
    { prompt: 'What associates packets with flows and labels them new, established, related or invalid?', answer: 'connection tracking', accept: ['conntrack'] },
    { prompt: 'Which three-letter mechanism rewrites addresses but is not an access policy?', answer: 'NAT' },
  ],
  'net-depth-1': [
    { prompt: 'Which function resolves addresses without hard-coding IPv4-only assumptions?', answer: 'getaddrinfo' },
    { prompt: 'Which framing choice puts the payload size at the start of each message?', answer: 'length prefix', accept: ['length-prefix', 'length prefixed'] },
  ],
};
