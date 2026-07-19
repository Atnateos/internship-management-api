import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'admin@infnova.com',
    name: 'System Admin',
    password: '', // set per-test with a real bcrypt hash
  };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns an access token and user profile for valid credentials', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      const result = await service.login({
        email: 'admin@infnova.com',
        password: 'correct-password',
      });

      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('never returns the password hash in the response', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      const result = await service.login({
        email: 'admin@infnova.com',
        password: 'correct-password',
      });

      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException when the email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@infnova.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      await expect(
        service.login({
          email: 'admin@infnova.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
