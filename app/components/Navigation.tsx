'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Gardens', href: '/gardens' },
  { name: 'Logs', href: '/logs' },
  { name: 'Seeds', href: '/seeds' },
  { name: 'Calc', href: '/calc' },
  { name: 'Calendar', href: '/calendar' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Disclosure as="nav" className="bg-dark-bg-secondary shadow-lg ring-1 ring-dark-border relative z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/" className="text-xl font-bold text-garden-400">
                    Garden Logbook
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'border-garden-500 text-dark-text-primary'
                          : 'border-transparent text-dark-text-secondary hover:border-dark-text-secondary hover:text-dark-text-primary',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium cursor-pointer relative'
                      )}
                      style={{ zIndex: 60 }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {session?.user ? (
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex rounded-full bg-dark-bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-garden-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      {session.user.image ? (
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={session.user.image}
                          alt=""
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-garden-600 text-center leading-8 text-white">
                          {session.user.name?.[0] || session.user.email?.[0]}
                        </div>
                      )}
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-dark-bg-secondary py-1 shadow-lg ring-1 ring-dark-border focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={classNames(
                                active ? 'bg-dark-bg-primary' : '',
                                'block px-4 py-2 text-sm text-dark-text-primary'
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        {session.user.role === 'ADMIN' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/admin"
                                className={classNames(
                                  active ? 'bg-dark-bg-primary' : '',
                                  'block px-4 py-2 text-sm text-dark-text-primary'
                                )}
                              >
                                Admin Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={classNames(
                                active ? 'bg-dark-bg-primary' : '',
                                'block w-full px-4 py-2 text-left text-sm text-dark-text-primary'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="rounded-md bg-garden-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-garden-500"
                  >
                    Sign in
                  </Link>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-garden-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'border-garden-500 bg-garden-50 text-garden-700'
                      : 'border-transparent text-dark-text-secondary hover:border-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-dark-border pb-3 pt-4">
              {session?.user ? (
                <>
                  <div className="flex items-center px-4">
                    {session.user.image ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt=""
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-garden-600 text-center leading-8 text-white">
                        {session.user.name?.[0] || session.user.email?.[0]}
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-base font-medium text-dark-text-primary">
                        {session.user.name}
                      </div>
                      <div className="text-sm font-medium text-dark-text-secondary">
                        {session.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as={Link}
                      href="/profile"
                      className="block px-4 py-2 text-base font-medium text-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary"
                    >
                      Your Profile
                    </Disclosure.Button>
                    {session.user.role === 'ADMIN' && (
                      <Disclosure.Button
                        as={Link}
                        href="/admin"
                        className="block px-4 py-2 text-base font-medium text-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary"
                      >
                        Admin Dashboard
                      </Disclosure.Button>
                    )}
                    <Disclosure.Button
                      as="button"
                      onClick={() => signOut()}
                      className="block w-full px-4 py-2 text-left text-base font-medium text-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className="block px-4 py-2 text-base font-medium text-dark-text-secondary hover:bg-dark-bg-primary hover:text-dark-text-primary"
                  >
                    Sign in
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 