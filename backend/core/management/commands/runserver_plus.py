import os
import subprocess
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Builds Next.js frontend and runs Django server'

    def handle(self, *args, **options):
        # Build Next.js frontend
        frontend_dir = os.path.join(os.path.dirname(settings.BASE_DIR), 'frontend')
        self.stdout.write('Building Next.js frontend...')
        subprocess.run(['npm', 'run', 'build'], cwd=frontend_dir, check=True)

        # Run Django server
        self.stdout.write('Starting Django server...')
        from django.core.management import call_command
        call_command('runserver', *args)
