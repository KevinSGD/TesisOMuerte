from scheduler.config.settings import DEFAULT_CONFIG
from scheduler.application.services.run_pipeline import run_pipeline


def main():
    result = run_pipeline(DEFAULT_CONFIG.copy())
    print(f"Estado: {result['status']}")
    print(result["message"])
    if result.get("excel_path"):
        print(f"Excel: {result['excel_path']}")


if __name__ == "__main__":
    main()
